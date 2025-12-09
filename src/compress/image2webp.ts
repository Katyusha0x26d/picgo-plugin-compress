import type { IPicGo } from 'picgo'
import sharp from 'sharp'
import { CommonParams, ImageInfo } from '../interface'
import { getImageBuffer, getImageInfo } from '../utils'

export async function Image2WebPCompress(ctx: IPicGo, { imageUrl, stripExif = true }: CommonParams): Promise<ImageInfo> {
  ctx.log.info('Image2WebP 压缩开始')
  const buffer = await getImageBuffer(ctx, imageUrl, { stripExif })
  ctx.log.info('转换图片为WebP')
  let pipeline = sharp(buffer, { failOn: 'none' })
  if (!stripExif) {
    pipeline = pipeline.withMetadata()
  }
  const webpBuffer = await pipeline.webp({ quality: 75 }).toBuffer()
  ctx.log.info('Image2WebP 压缩成功')
  const info = getImageInfo(imageUrl, webpBuffer)
  const extname = '.webp'
  const fileName = info.fileName.replace(info.extname, extname)
  return {
    ...info,
    fileName,
    extname,
  }
}
