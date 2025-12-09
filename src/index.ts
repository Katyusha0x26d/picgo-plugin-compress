import type { IPicGo } from 'picgo'
import type { IPluginConfig } from 'picgo/dist/utils/interfaces'
import { TinypngCompress } from './compress/tinypngweb'
import { TinypngKeyCompress } from './compress/tinypng/index'
import { ImageminCompress } from './compress/imagemin'
import { Image2WebPCompress } from './compress/image2webp'
import { CompressType } from './config'
import { getUrlInfo } from './utils'
import { IConfig, ImageInfo } from './interface'
import { SkipCompress } from './compress/skip'

const ALLOW_EXTNAME = ['.png', '.jpg', '.webp', '.jpeg']

function handle(ctx: IPicGo) {
  const config = (ctx.getConfig<Partial<IConfig>>('transformer.compress') ?? ctx.getConfig<Partial<IConfig>>('picgo-plugin-compress')) || {}
  const compress = config?.compress
  const key = config?.key || config?.tinypngKey
  const clearExif = config?.clearExif ?? true

  ctx.log.info('压缩:' + compress)

  const inputs = Array.isArray(ctx.input) ? ctx.input : []
  const tasks: Array<Promise<ImageInfo>> = inputs.map((rawInput: unknown) => {
    const imageUrl = String(rawInput)
    ctx.log.info('图片地址:' + imageUrl)
    const info = getUrlInfo(imageUrl)
    ctx.log.info('图片信息:' + JSON.stringify(info))
    if (ALLOW_EXTNAME.includes(info.extname.toLowerCase())) {
      switch (compress) {
        case CompressType.tinypng:
          return key ? TinypngKeyCompress(ctx, { imageUrl, key, stripExif: clearExif }) : TinypngCompress(ctx, { imageUrl, stripExif: clearExif })
        case CompressType.imagemin:
          return ImageminCompress(ctx, { imageUrl, stripExif: clearExif })
        case CompressType.image2webp:
          return Image2WebPCompress(ctx, { imageUrl, stripExif: clearExif })
        default:
          return key ? TinypngKeyCompress(ctx, { imageUrl, key, stripExif: clearExif }) : TinypngCompress(ctx, { imageUrl, stripExif: clearExif })
      }
    }
    ctx.log.warn('不支持的格式，跳过压缩')
    return SkipCompress(ctx, { imageUrl, stripExif: clearExif })
  })

  return Promise.all(tasks).then((output: ImageInfo[]) => {
    ctx.log.info(
      '图片信息:' +
        JSON.stringify(output.map((item: ImageInfo) => ({ fileName: item.fileName, extname: item.extname, height: item.height, width: item.width })))
    )
    ctx.output = output
    return ctx
  })
}

module.exports = function (ctx: IPicGo): any {
  return {
    transformer: 'compress',
    register() {
      ctx.helper.transformer.register('compress', { handle })
    },
    config(ctx: IPicGo): IPluginConfig[] {
      const config = (ctx.getConfig<Partial<IConfig>>('transformer.compress') ?? ctx.getConfig<Partial<IConfig>>('picgo-plugin-compress')) || {}
      return [
        {
          name: 'compress',
          type: 'list',
          message: '选择压缩库',
          choices: Object.keys(CompressType),
          default: config.compress || CompressType.tinypng,
          required: true,
        },
        {
          name: 'clearExif',
          type: 'confirm',
          message: '是否在压缩前清除EXIF信息',
          default: config.clearExif ?? true,
          required: true,
        },
        {
          name: 'key',
          type: 'input',
          message: '申请key，不填默认使用WebApi，逗号隔开，可使用多个Key叠加使用次数',
          default: config.key || config.tinypngKey || null,
          required: false,
        },
      ]
    },
  }
}
