# Vertical Right-To-Left Layout

Vertical right-to-left pages are read one column at a time:

```text
column: top to bottom
page: right column to left column
```

OCR.space can recognize the words, but `ParsedText` is not always in this order. This plugin therefore prefers `TextOverlay.Lines[].Words[]` whenever overlay data is character-level or short-word-level. The algorithm itself is coordinate-based and not limited to Japanese, though the first target case is Japanese vertical book pages.

There is one important exception: OCR.space Engine 3 can return coarse overlay blocks where each "word" is already a long sentence line. Those boxes are not usable as vertical character coordinates. When this is detected, the plugin falls back to `ParsedText` instead of forcing `vertical_rl` clustering.

## Algorithm

1. Flatten `TextOverlay.Lines[].Words[]`.
2. Drop empty words and words with invalid `Left`, `Top`, `Width`, or `Height`.
3. Build pixel boxes and centers for each word.
4. Compute median word width and height.
5. Use this column threshold:

```text
clamp(max(medianWordWidth * 1.5, medianWordHeight * 0.45), 8px, imageWidth * 0.08)
```

6. Sort words by x center from right to left and cluster them into columns.
7. Sort columns by x center from right to left.
8. Sort each column by y center from top to bottom.
9. Join CJK text directly; keep one space between adjacent ASCII word/number tokens.
10. Return each column as one Bob OCR text object. Its bounding box is the union of its word boxes.

## Recommended Bob Settings

| Option | Value |
|---|---|
| Engine | Engine 3 |
| Language Mode | Force Japanese |
| Layout Mode | Vertical right-to-left |
| Text Overlay | On |
| Scale | On |
| Detect Orientation | Off |

Use Engine 1 or 2 if image-translation box placement is more important than OCR accuracy. On some vertical Japanese scans, Engine 1 returns character-level overlay coordinates that are better suited for right-to-left column reconstruction.

## Limitations

- Ruby/furigana can be detected as separate narrow columns.
- Headers, footers, and page numbers are not filtered automatically.
- Two-page scans are not split automatically.
- Engine 3 overlay boxes are available, but OCR.space documents that they are less precise than Engine 1/2.

For difficult book pages, crop one page at a time and compare Engine 1, Engine 2, and Engine 3.
