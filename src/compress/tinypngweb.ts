import type { IPicGo } from 'picgo'
import { CommonParams, ImageInfo } from '../interface'
import { TINYPNG_WEBUPLOAD_URL } from '../config'
import { getImageBuffer, getImageInfo, getPicGoRequester } from '../utils'

function getHeaders() {
  const v = 59 + Math.round(Math.random() * 10)
  const v2 = Math.round(Math.random() * 100)
  return {
    origin: TINYPNG_WEBUPLOAD_URL,
    referer: TINYPNG_WEBUPLOAD_URL,
    'content-type': 'application/x-www-form-urlencoded',
    'user-agent': `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${v}.0.4044.${v2} Safari/537.36`,
  }
}

export async function TinypngCompress(ctx: IPicGo, { imageUrl, stripExif = true }: CommonParams): Promise<ImageInfo> {
  const buffer = await getImageBuffer(ctx, imageUrl, { stripExif })
  ctx.log.info('TinypngWeb 压缩开始')
  const requester = getPicGoRequester(ctx)
  const response = (await requester({
    url: TINYPNG_WEBUPLOAD_URL,
    method: 'POST',
    headers: getHeaders(),
    data: buffer,
    responseType: 'json',
    resolveWithFullResponse: true,
    maxBodyLength: Infinity,
  })) as {
    headers: Record<string, string | string[] | undefined>
  }
  const locationHeader = response.headers.location ?? response.headers.Location
  const location = Array.isArray(locationHeader) ? locationHeader[0] : locationHeader
  if (!location) {
    throw new Error('TinypngWeb 上传失败')
  }
  ctx.log.info('TinypngWeb 压缩成功:' + location)
  ctx.log.info('下载 Tinypng 图片')
  const downloadBuffer = await getImageBuffer(ctx, location)
  return getImageInfo(imageUrl, downloadBuffer)
}
