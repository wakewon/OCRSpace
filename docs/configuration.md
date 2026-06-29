# Configuration

This plugin reads Bob options from `info.json` and sends a POST request to `https://api.ocr.space/parse/image`. The image is sent as OCR.space `base64Image` in a URL-encoded form body so image data and OCR parameters use the same payload path.

## Options

| Option | Default | Behavior |
|---|---|---|
| `apiKey` | empty | Required. Secure text. Comma-separated keys are supported. |
| `engine` | `1` | OCR.space `OCREngine`. Allowed values: `1`, `2`, `3`. |
| `layoutMode` | `auto` | Controls TextOverlay reading-order reconstruction. |
| `overlay` | `true` | Sends `isOverlayRequired=true`; required for bounding boxes. |
| `scale` | `false` | Sends `scale=true` for low-resolution image enhancement. |
| `detectOrientation` | `false` | Sends `detectOrientation`; keep off for vertical text. |
| `isTable` | `false` | Sends `isTable=true` for table-like input. |

## Language Settings

The plugin automatically maps Bob's requested source language to OCR.space three-letter language codes. If Bob is set to auto-detect the language, Engine 2/3 will use OCR.space's auto-detection feature, while Engine 1 will fall back to Bob's detected language.

OCR.space language codes are three-letter codes. Examples:

| Bob | OCR.space |
|---|---|
| `ja` | `jpn` |
| `en` | `eng` |
| `zh-Hans` | `chs` |
| `zh-Hant` | `cht` |
| `ko` | `kor` |

## Layout Modes

- `service`: trust OCR.space `TextOverlay` line/word order.
- `horizontal`: cluster words into rows by y-coordinate, then sort each row left-to-right.
- `vertical_rl`: cluster words into vertical columns by x-coordinate, sort columns right-to-left, sort each column top-to-bottom.
- `auto`: run a simple vertical-layout heuristic on overlay coordinates; if the page looks vertical, use `vertical_rl`; otherwise use `horizontal`.


