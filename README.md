## picgo-plugin-compress

原[juzisang/picgo-plugin-compress](https://github.com/juzisang/picgo-plugin-compress)的 fork 版，增加了 EXIF 信息清理等功能

用于 [PicGo](https://github.com/Molunerfinn/PicGo) 的图片压缩插件，支持 [TinyPng](https://tinypng.com/) [ImageMin](https://github.com/imagemin/imagemin)

## 安装

```shell
git clone https://github.com/Katyusha0x26d/picgo-plugin-compress.git
cd picgo-plugin-compress
npm install
npm run build
```

构建完成后，在 PicGo 插件设置页面，安装本地插件，选择此 git 仓库目录

## 压缩效果对比

| 类型   | tinypng                | imagemin                | image2webp                    |
| ------ | ---------------------- | ----------------------- | ----------------------------- |
| 原大小 | 4.40 MB                | 4.40 MB                 | 4.40 MB                       |
| 压缩后 | 1.46 MB                | 1.52MB                  | 187 KB                        |
| 效果图 | ![](tests/tinypng.png) | ![](tests/imagemin.png) | ![](tests/imagemin_webp.webp) |

## EXIF 信息去除

| 类型      | 原始带 EXIF 图片                                   | imagemin 去除 EXIF                                     | image2webp 去除 EXIF                                               | imagemin 保留 EXIF                                 | image2webp 保留 EXIF                                           |
| --------- | -------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------ | -------------------------------------------------- | -------------------------------------------------------------- |
| EXIF 信息 | Make:SONY,Model:ILCE-7M2,...                       | -                                                      | -                                                                  | Make:SONY,Model:ILCE-7M2,...                       | Make:SONY,Model:ILCE-7M2,...                                   |
| 示例文件  | [tests/original_exif.jpg](tests/original_exif.jpg) | [tests/imagemin_noexif.jpg](tests/imagemin_noexif.jpg) | [tests/imagemin_webp_noexif.webp](tests/imagemin_webp_noexif.webp) | [tests/imagemin_exif.jpg](tests/imagemin_exif.jpg) | [tests/imagemin_webp_exif.webp](tests/imagemin_webp_exif.webp) |

**注：tinypng 服务端会自动去除 EXIF 信息，所以对于 tinypng 压缩选项，即使没用勾选去除 EXIF，也会自动去除 EXIF 信息**
