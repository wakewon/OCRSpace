# OCR.space OCR for Bob

![OCR.space Logo](docs/images/logo.png)

English | [简体中文](README_zh.md)

OCR.space OCR for Bob is an OCR plugin that connects Bob to the OCR.space API. It supports OCR.space Engine 1, 2, and 3, Bob image translation bounding boxes, and coordinate-based right-to-left vertical reading-order reconstruction.

## Features

- OCR.space Engine 1, 2, and 3.
- Bob OCR and Bob original image translation support through `supportBoundingBox()`.
- Word-level bounding boxes converted from OCR.space pixels to Bob normalized `[0, 1]` coordinates.
- Vertical right-to-left page mode: columns are read top-to-bottom, then right-to-left.
- Configurable OCR language policy, layout policy, overlay, scale, orientation detection, and table mode.
- Build script that creates a `.bobplugin` package and updates `appcast.json`.

## Install

1. Download `OCRSpaceOCR-v0.1.0.bobplugin` from the GitHub Release page.
2. Double-click the file to install it in Bob.

3. Open Bob preferences, add and enable the `OCR.space OCR` service under the corresponding features, and configure your OCR.space API Key:
   - For **Screenshot Translation**: Add the plugin's service to the list at `Translation > Translation Settings > Services > Text Recognition`.
   - For **Independent OCR**: Add the plugin's service to the list at `OCR > OCR Settings`.
   
   *Tip: You can add the service multiple times with different settings (e.g., different engines or layout modes) to quickly switch between them depending on your needs.*

## OCR.space API Key

Create or copy an API key from [OCR.space Free OCR API](https://ocr.space/ocrapi/freekey). (For PRO plans, visit the [main API page](https://ocr.space/ocrapi)). The plugin sends the key in the `apikey` HTTP header, not in the URL. You can enter multiple keys separated by commas; the plugin chooses one randomly for each request.

## Recommended Settings

| Scenario | Engine | Layout Mode | Overlay | Scale | Detect Orientation |
|---|---:|---|---|---|---|
| Coordinate precision first (Default) | 1 | Auto | On | Off | Off |
| Japanese vertical book page | 1 or 3 | Vertical right-to-left | On | Off | Off |
| Normal screenshots | 1 or 2 | Auto | On | Off | Off |
| Speed first | 1 | Trust OCR.space order | Off | Off | Off |
| Receipts and tables | 2 or 3 | Auto | On | Off | Off, Table Mode On |

OCR.space Engine 3 has the best OCR accuracy but is slower. Engine 1 is the default because it is the fastest and its overlay coordinates are the most precise, which makes it ideal for Bob's image translation bounding boxes and text selection.

For Japanese vertical pages, Engine 3 sometimes returns high-quality `ParsedText` but only coarse overlay blocks (which the plugin now handles by approximating the bounding boxes). If you need strict character-level vertical coordinates for precise right-to-left reconstruction and selection, use Engine 1.

## Configuration

See [docs/configuration.md](docs/configuration.md) for all options.

Important defaults:

- `engine`: `1`
- `layoutMode`: `auto`
- `overlay`: `true`
- `scale`: `false`
- `detectOrientation`: `false`

The plugin automatically maps Bob's requested source language to OCR.space three-letter language codes. If Bob is set to auto-detect the language, Engine 2/3 will use OCR.space's auto-detection feature, while Engine 1 will fall back to Bob's detected language.

The plugin sends the image as OCR.space `base64Image` in a URL-encoded request body. This keeps `language`, `OCREngine`, and overlay fields in the same form payload and avoids Bob multipart requests losing non-file fields on some setups.

## Vertical Pages

For vertical text, do not rely on `ParsedText` alone. This plugin reconstructs reading order from OCR.space `TextOverlay.Lines[].Words[]` coordinates when the overlay is character-level or short-word-level:

1. Flatten all words with boxes.
2. Cluster words by horizontal center into vertical columns.
3. Sort columns from right to left.
4. Sort each column from top to bottom.
5. Return each column as a Bob OCR text object with a normalized bounding box.

Known first-version limitations: ruby text can form extra narrow columns, page headers and page numbers can enter the reading order, and two-page scans are not split automatically. See [docs/vertical-japanese.md](docs/vertical-japanese.md).

## Build

```bash
./build.sh
```

The package is written to:

```text
release/OCRSpaceOCR-v0.1.0.bobplugin
```

The script updates `appcast.json` with the package SHA256 and timestamp.

## Release

See [docs/release.md](docs/release.md). The package must not include `.git`, `local_assets`, `release`, old `.bobplugin` files, test fixtures, caches, or temporary files.

## Troubleshooting

See [docs/troubleshooting.md](docs/troubleshooting.md).

Common causes:

- Missing or invalid API key.
- OCR.space quota or size limits.
- Engine 1 selected with `languageMode=auto` and no Bob-detected supported language.
- Overlay disabled, which prevents Bob image translation boxes and vertical reconstruction.

## License

MIT
