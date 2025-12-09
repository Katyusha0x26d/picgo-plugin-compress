import * as fs from 'fs-extra'
import type { IPicGo } from 'picgo'
import imageSize from 'image-size'
import { extname, basename } from 'path'
import sharp from 'sharp'
import { ImageInfo } from './interface'

export function getPicGoRequester(ctx: IPicGo) {
  if (typeof ctx.request !== 'function') {
    throw new Error('ctx.request 不可用，请升级 PicGo 至 1.5+')
  }
  return ctx.request
}

/** 使用 sharp 清除 EXIF 等元数据；失败时返回原始 Buffer */
export async function stripExif(buffer: Buffer): Promise<Buffer> {
  try {
    // rotate() 会根据 EXIF 方向自动修正，但输出中不再保留原始 EXIF
    return await sharp(buffer, { failOn: 'none' }).rotate().toBuffer()
  } catch {
    return buffer
  }
}

export function isNetworkUrl(url: string) {
  return url.startsWith('http://') || url.startsWith('https://')
}

export async function fetchImage(ctx: IPicGo, url: string): Promise<Buffer> {
  const requester = getPicGoRequester(ctx)
  const response = (await requester({
    method: 'GET',
    url,
    responseType: 'arraybuffer',
    resolveWithFullResponse: true,
  })) as {
    data: Buffer
    headers: Record<string, string | string[] | undefined>
  }
  const contentType = response.headers['content-type']
  const contentTypeValue = Array.isArray(contentType) ? contentType[0] : contentType
  if (contentTypeValue && !contentTypeValue.includes('image')) {
    throw new Error(`${url} 不是图片`)
  }
  return Buffer.isBuffer(response.data) ? response.data : Buffer.from(response.data)
}

export async function getImageBuffer(ctx: IPicGo, imageUrl: string, options?: { stripExif?: boolean }): Promise<Buffer> {
  let buffer: Buffer
  if (isNetworkUrl(imageUrl)) {
    ctx.log.info('获取网络图片')
    buffer = await fetchImage(ctx, imageUrl)
  } else {
    ctx.log.info('获取本地图片')
    buffer = await fs.readFile(imageUrl)
  }
  // 统一在此处清理 EXIF，再交给后续压缩逻辑处理
  if (options?.stripExif ?? true) {
    return stripExif(buffer)
  }
  return buffer
}

export function getImageInfo(imageUrl: string, buffer: Buffer): ImageInfo {
  const { width, height } = imageSize(buffer)
  return {
    buffer,
    width: width as number,
    height: height as number,
    fileName: basename(imageUrl),
    extname: extname(imageUrl),
  }
}

export function getUrlInfo(imageUrl: string) {
  return {
    fileName: basename(imageUrl),
    extname: extname(imageUrl),
  }
}
