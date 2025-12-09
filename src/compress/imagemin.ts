import type { IPicGo } from 'picgo'
import sharp from 'sharp'
import { extname } from 'path'
import { CommonParams, ImageInfo } from '../interface'
import { getImageBuffer, getImageInfo } from '../utils'

const JPEG_EXTENSIONS = new Set(['.jpg', '.jpeg'])
const PNG_EXTENSIONS = new Set(['.png'])
const WEBP_EXTENSIONS = new Set(['.webp'])

async function compressWithSharp(buffer: Buffer, ext: string, preserveMetadata: boolean): Promise<Buffer> {
  let instance = sharp(buffer, { failOn: 'none' })
  if (preserveMetadata) {
    instance = instance.withMetadata()
  }
  if (JPEG_EXTENSIONS.has(ext)) {
    return instance.jpeg({ quality: 75, progressive: true }).toBuffer()
  }
  if (PNG_EXTENSIONS.has(ext)) {
    return instance.png({ compressionLevel: 9, palette: true }).toBuffer()
  }
  if (WEBP_EXTENSIONS.has(ext)) {
    return instance.webp({ quality: 75 }).toBuffer()
  }
  return buffer
}

export async function ImageminCompress(ctx: IPicGo, { imageUrl, stripExif = true }: CommonParams): Promise<ImageInfo> {
  ctx.log.info('imagemin 压缩开始')
  const buffer = await getImageBuffer(ctx, imageUrl, { stripExif })
  const ext = extname(imageUrl).toLowerCase()
  try {
    const optimized = await compressWithSharp(buffer, ext, !stripExif)
    ctx.log.info('imagemin 压缩完成')
    return getImageInfo(imageUrl, optimized)
  } catch (error) {
    ctx.log.error(`imagemin 压缩失败: ${(error as Error).message}`)
    return getImageInfo(imageUrl, buffer)
  }
}
