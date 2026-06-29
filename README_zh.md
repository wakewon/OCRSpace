# OCR.space OCR for Bob

![OCR.space Logo](docs/images/logo.png)

[English](README.md) | 简体中文

OCR.space OCR for Bob 是一款将 Bob 与 OCR.space API 连接的 OCR 插件。它支持 OCR.space Engine 1、2 和 3，支持 Bob 原图翻译的位置框，以及基于坐标的从右到左竖排阅读顺序重排。

## 功能特性

- 支持 OCR.space Engine 1、2 和 3。
- 通过 `supportBoundingBox()` 支持 Bob 的 OCR 和原图翻译位置框。
- 将 OCR.space 像素级的 word 坐标转换为 Bob 标准的 `[0, 1]` 归一化坐标。
- 竖排从右到左页面模式：列按从上到下读取，然后按从右到左排序。
- 可配置的 OCR 语言策略、版面策略、文字坐标 (overlay)、低清增强 (scale)、方向检测和表格模式。
- 包含用于创建 `.bobplugin` 发布包并更新 `appcast.json` 的构建脚本。

## 安装

1. 从 GitHub Releases 页面下载 `OCRSpaceOCR-v0.1.0.bobplugin`。
2. 双击文件将其安装到 Bob。

3. 打开 Bob 偏好设置，并在对应的功能下添加并启用 `OCR.space OCR` 服务，然后配置你的 OCR.space API Key：
   - 如果用于**截图翻译**：请在 `翻译 > 翻译设置 > 服务 > 文本识别` 列表中添加本插件的服务。
   - 如果用于**独立OCR**：请在 `OCR > OCR设置` 列表中添加本插件的服务。
   
   *提示：你可以多次添加该服务，分别配置不同的引擎或版面模式，以便在不同场景下快速切换。*

## OCR.space API Key

在 [OCR.space 免费 OCR API](https://ocr.space/ocrapi/freekey) 创建或复制 API Key。（如需了解 PRO 等付费套餐，请访问 [API 主页](https://ocr.space/ocrapi)）。插件在 HTTP 头部的 `apikey` 字段发送 Key，而不是放在 URL 中。你可以输入用英文逗号分隔的多个 Key；插件在每次请求时会随机选择一个。

## 推荐设置

| 场景 | 引擎 | 版面模式 | 文字坐标(Overlay) | 低清增强(Scale) | 方向检测 |
|---|---:|---|---|---|---|
| 位置框精准度优先 (默认) | 1 | 自动 | 开启 | 关闭 | 关闭 |
| 日文竖排书籍页面 | 1 或 3 | 竖排从右到左 | 开启 | 关闭 | 关闭 |
| 正常屏幕截图 | 1 或 2 | 自动 | 开启 | 关闭 | 关闭 |
| 速度优先 | 1 | 信任 OCR.space 顺序 | 关闭 | 关闭 | 关闭 |
| 收据和表格 | 2 或 3 | 自动 | 开启 | 关闭 | 关闭，开启表格模式 |

OCR.space Engine 3 的识别准确率最高但速度较慢。Engine 1 是默认选项，因为它的速度最快，而且它的坐标叠加最精确，非常适合 Bob 的原图翻译位置框和文本选择功能。

对于日文竖排页面，Engine 3 有时会返回高质量的 `ParsedText`，但只有粗粒度的区块坐标（插件目前会通过近似算法来保留这些位置框）。如果你需要严格的字符级垂直坐标以进行精确的从右到左重排和文本选择，建议使用 Engine 1。

## 配置

查看 [docs/configuration.md](docs/configuration.md) 获取所有选项说明。

重要的默认设置：

- `engine` (引擎): `1`
- `layoutMode` (版面模式): `auto`
- `overlay` (文字坐标): `true`
- `scale` (低清增强): `false`
- `detectOrientation` (方向检测): `false`

插件会自动将 Bob 请求的源语言映射为 OCR.space 的三字母语言代码。如果 Bob 设置为自动检测语言，Engine 2/3 将使用 OCR.space 的自动检测功能，而 Engine 1 则会降级使用 Bob 检测出的具体语言。

插件会将图像作为 URL 编码的请求体中的 `base64Image` 发送到 OCR.space。这样可以保持 `language`、`OCREngine` 和 overlay 等字段在同一个表单负载中，避免 Bob 的 multipart 请求在某些环境下丢失非文件字段。

## 竖排页面

对于竖排文本，不要仅仅依赖 `ParsedText`。当 OCR 返回字符级或短词级坐标时，本插件会从 OCR.space 的 `TextOverlay.Lines[].Words[]` 坐标中重建阅读顺序：

1. 展平所有包含位置框的单词。
2. 根据水平中心 (x坐标) 将单词聚类成垂直列。
3. 从右到左对列进行排序。
4. 从上到下对每列进行排序。
5. 将每列作为一个带有归一化位置框的 Bob OCR 文本对象返回。

初版已知限制：旁注 (ruby text) 可能会形成非常窄的列，页眉和页码可能会进入阅读顺序，且无法自动拆分双页扫描图。详见 [docs/vertical-japanese.md](docs/vertical-japanese.md)。

## 构建

```bash
./build.sh
```

包将被输出到：

```text
release/OCRSpaceOCR-v0.1.0.bobplugin
```

该脚本会更新 `appcast.json` 中的 SHA256 校验和和时间戳。

## 发布

详见 [docs/release.md](docs/release.md)。发布包不得包含 `.git`、`local_assets`、`release`、旧的 `.bobplugin` 文件、测试 fixture、缓存或临时文件。

## 故障排除

详见 [docs/troubleshooting.md](docs/troubleshooting.md)。

常见原因：

- 缺少或无效的 API Key。
- OCR.space 配额或大小限制。
- 选择了 Engine 1 且没有被 Bob 检测到支持的语言。
- 关闭了 文字坐标(Overlay)，这将导致无法使用 Bob 原图翻译位置框和竖排重建功能。

## 许可证

MIT
