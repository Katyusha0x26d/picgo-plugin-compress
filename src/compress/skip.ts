import type { IPicGo } from 'picgo'
import { getImageBuffer, getImageInfo } from '../utils'
import { CommonParams, ImageInfo } from '../interface'

export function SkipCompress(ctx: IPicGo, { imageUrl, stripExif = true }: CommonParams): Promise<ImageInfo> {
  return getImageBuffer(ctx, imageUrl, { stripExif }).then((buffer) => getImageInfo(imageUrl, buffer))
}
