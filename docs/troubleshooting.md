# Troubleshooting

## API Key Errors

If Bob reports `secretKey`, configure `OCR.space API Key` in Bob Preferences. The plugin sends the key through the `apikey` header.

## Engine 1 And Auto Language

OCR.space `language=auto` is available only for Engine 2/3. If Engine 1 is selected with `languageMode=auto`, the plugin uses Bob's concrete detected or selected language. If Bob has no supported concrete language, the plugin returns `unsupportedLanguage`.

## No Bounding Boxes

Bob image translation needs normalized `boundingBox.points`. Check:

- `Text Overlay` is On.
- Bob version is at least `1.20.0`.
- `query.pixelWidth` and `query.pixelHeight` are available.
- OCR.space returned `TextOverlay`.

If image dimensions are missing, the plugin still returns text but omits bounding boxes to avoid sending pixel coordinates to Bob.

## Slow Engine 3 Requests

OCR.space documents that Engine 3 is slower on large files, and requesting overlay can make Engine 3 substantially slower. Try:

- Engine 2 for faster OCR with overlay.
- Turning `Scale` off for already sharp screenshots.
- Cropping large pages before OCR.

## Poor Vertical Order

Use:

- `Language Mode`: Force Japanese
- `Layout Mode`: Vertical right-to-left
- `Text Overlay`: On
- `Detect Orientation`: Off

If ruby text, page numbers, or two-page scans are involved, crop the image and retry.

If Engine 3 returns good text but poor order or poor boxes, try Engine 1. Engine 3 may return coarse overlay blocks; the plugin will fall back to `ParsedText` to avoid worse coordinate-based scrambling, but that means Bob image-translation boxes may be less useful for that page.

## OCR.space API Errors

The plugin maps OCR.space failures to Bob service errors:

| Situation | Bob error type |
|---|---|
| Missing API key | `secretKey` |
| Invalid option or JSON | `param` |
| Unsupported language | `unsupportedLanguage` |
| HTTP/network failure | `network` or `api` |
| No recognized text | `notFound` |
| OCR.space processing failure | `api` |

Error details include engine, language, layout, HTTP status, and OCR.space exit codes. They do not include API keys or image data.
