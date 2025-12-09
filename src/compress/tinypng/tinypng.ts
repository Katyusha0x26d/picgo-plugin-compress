import * as path from 'path'
import * as fs from 'fs-extra'
import { getImageBuffer, isNetworkUrl, getPicGoRequester } from '../../utils'
import { TINYPNG_UPLOAD_URL } from '../../config'
import Base64 from 'crypto-js/enc-base64'
import Utf8 from 'crypto-js/enc-utf8'
import type { IPicGo } from 'picgo'

interface TinyPngOptions {
  keys: string[]
  ctx: IPicGo
}

interface TinyCacheConfig {
  [key: string]: {
    key: string
    num: number
  }
}

class TinyPng {
  private cacheConfigPath = path.join(__dirname, 'config.json')
  private options!: TinyPngOptions
  private PicGo!: IPicGo

  async init(options: TinyPngOptions) {
    this.PicGo = options.ctx
    this.options = options
    await this.readOrWriteConfig(this.options.keys)
    this.PicGo.log.info('TinyPng初始化')
  }

  async upload(url: string, stripExif = true) {
    this.PicGo.log.info('TinyPng开始上传')
    if (isNetworkUrl(url)) {
      return this.uploadImage({ url, originalUrl: url, key: await this.getKey(), stripExif })
    } else {
      return this.uploadImage({
        key: await this.getKey(),
        originalUrl: url,
        buffer: await getImageBuffer(this.PicGo, url, { stripExif }),
        stripExif,
      })
    }
  }

  private async getKey() {
    const config = await this.readOrWriteConfig()
    const innerKeys = Object.keys(config).filter((key) => config[key].num !== -1)
    if (innerKeys.length <= 0) {
      throw new Error('使用次数用完')
    }
    return innerKeys[0]
  }

  private async uploadImage(options: { key: string; originalUrl: string; url?: string; buffer?: Buffer; stripExif?: boolean }): Promise<Buffer> {
    this.PicGo.log.info('使用TinypngKey:' + options.key)

    const bearer = Base64.stringify(Utf8.parse(`api:${options.key}`))

    const headers: Record<string, string> = {
      Host: 'api.tinify.com',
      Authorization: `Basic ${bearer}`,
    }

    let data: Buffer | Record<string, any>

    if (options.url) {
      this.PicGo.log.info('TinyPng 上传网络图片')
      headers['Content-Type'] = 'application/json'
      data = {
        source: {
          url: options.url,
        },
      }
    } else if (options.buffer) {
      this.PicGo.log.info('TinyPng 上传本地图片')
      headers['Content-Type'] = 'application/octet-stream'
      data = options.buffer
    } else {
      throw new Error('无效的 Tinypng 上传参数')
    }

    const requester = getPicGoRequester(this.PicGo)
    const response = (await requester({
      method: 'POST',
      url: TINYPNG_UPLOAD_URL,
      headers,
      data,
      responseType: 'json',
      resolveWithFullResponse: true,
      maxBodyLength: Infinity,
    })) as {
      status?: number
      statusCode?: number
      headers: Record<string, string | string[] | undefined>
    }

    const compressionCountHeader = response.headers['compression-count']
    if (compressionCountHeader) {
      const countValue = Array.isArray(compressionCountHeader) ? compressionCountHeader[0] : compressionCountHeader
      const compressionCount = parseInt(countValue || '0', 10)
      if (!Number.isNaN(compressionCount)) {
        await this.setConfig(options.key, compressionCount)
      }
    }

    const statusCode = response.status ?? response.statusCode ?? 0

    if (statusCode >= 200 && statusCode <= 299) {
      const locationHeader = response.headers.location ?? response.headers.Location
      const location = Array.isArray(locationHeader) ? locationHeader[0] : locationHeader
      if (!location) {
        throw new Error('Tinypng 未返回下载地址')
      }
      return getImageBuffer(this.PicGo, location)
    }

    if (statusCode === 429) {
      await this.setConfig(options.key, -1)
      return this.upload(options.originalUrl)
    }

    throw new Error(`未知错误: ${statusCode}`)
  }

  private async setConfig(key: string, num: number) {
    const config = await this.readOrWriteConfig()
    config[key] = {
      key,
      num,
    }
    await fs.writeJSON(this.cacheConfigPath, config)
  }

  private async readOrWriteConfig(keys?: string[]): Promise<TinyCacheConfig> {
    const config: TinyCacheConfig = {}
    if (await fs.pathExists(this.cacheConfigPath)) {
      Object.assign(config, await fs.readJSON(this.cacheConfigPath))
    } else {
      await fs.writeJSON(this.cacheConfigPath, {})
    }
    if (keys) {
      await fs.writeJSON(
        this.cacheConfigPath,
        keys.reduce((res, key) => {
          if (!res[key]) {
            res[key] = {
              key,
              num: 0,
            }
          }
          return res
        }, config)
      )
    }
    return config
  }
}

export default new TinyPng()
