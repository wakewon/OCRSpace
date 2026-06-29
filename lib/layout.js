'use strict';

var bbox = require('./bounding-box');

function median(values) {
  var sorted = values.filter(function (value) {
    return isFinite(value);
  }).sort(function (a, b) {
    return a - b;
  });
  if (sorted.length === 0) {
    return 0;
  }
  var mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2) {
    return sorted[mid];
  }
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function clamp(value, min, max) {
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}

function extractWords(parsedResult) {
  var overlay = parsedResult && parsedResult.TextOverlay;
  var lines = overlay && overlay.Lines;
  if (!lines || !Array.isArray(lines)) {
    return [];
  }
  var words = [];
  for (var lineIndex = 0; lineIndex < lines.length; lineIndex++) {
    var line = lines[lineIndex];
    var lineWords = line && line.Words;
    if (!lineWords || !Array.isArray(lineWords)) {
      continue;
    }
    for (var wordIndex = 0; wordIndex < lineWords.length; wordIndex++) {
      var source = lineWords[wordIndex];
      var text = source && source.WordText !== undefined ? String(source.WordText).trim() : '';
      var box = bbox.pixelBoxFromWord(source);
      if (!text || !box) {
        continue;
      }
      words.push({
        text: text,
        box: box,
        lineIndex: lineIndex,
        wordIndex: wordIndex,
        source: source
      });
    }
  }
  return words;
}

function hasOverlayWords(parsedResult) {
  return extractWords(parsedResult).length > 0;
}

function isCoarseOverlay(words) {
  if (!words || words.length === 0) {
    return false;
  }
  var longWords = words.filter(function (word) {
    return word.text.length >= 8;
  }).length;
  var medianWidth = median(words.map(function (word) { return word.box.width; }));
  var medianHeight = median(words.map(function (word) { return word.box.height; }));
  return longWords / words.length >= 0.45 || (medianHeight > 0 && medianWidth / medianHeight >= 8);
}

function isAsciiWord(text) {
  return /^[A-Za-z0-9]+$/.test(text);
}

function isClosingPunctuation(text) {
  return /^[,.;:!?%)\]\}、。，．！？）」』】》〕〗〙〛]$/.test(text);
}

function isOpeningPunctuation(text) {
  return /^[(\[\{（「『【《〔〖〘〚]$/.test(text);
}

function needsSpace(prev, next) {
  if (!prev || !next) {
    return false;
  }
  if (isClosingPunctuation(next) || isOpeningPunctuation(prev)) {
    return false;
  }
  return isAsciiWord(prev) && isAsciiWord(next);
}

function joinWords(words) {
  var output = '';
  var previous = '';
  words.forEach(function (word) {
    var text = word.text;
    if (!text) {
      return;
    }
    if (output && needsSpace(previous, text)) {
      output += ' ';
    }
    output += text;
    previous = text;
  });
  return output;
}

function toTextObject(words, dimensions) {
  var text = joinWords(words);
  if (!text) {
    return undefined;
  }
  var textObject = { text: text };
  var union = bbox.unionPixelBoxes(words.map(function (word) { return word.box; }));
  var normalized = bbox.normalizePixelBox(union, dimensions.pixelWidth, dimensions.pixelHeight);
  if (normalized) {
    textObject.boundingBox = normalized;
  }
  textObject._pixelBox = union;
  return textObject;
}

function stripInternalFields(texts) {
  return texts.map(function (text) {
    var copy = { text: text.text };
    if (text.boundingBox) {
      copy.boundingBox = text.boundingBox;
    }
    return copy;
  });
}

function buildServiceTexts(parsedResult, dimensions) {
  var overlay = parsedResult && parsedResult.TextOverlay;
  var lines = overlay && overlay.Lines;
  var texts = [];
  if (lines && Array.isArray(lines)) {
    for (var i = 0; i < lines.length; i++) {
      var lineWords = [];
      var sourceWords = lines[i] && lines[i].Words;
      if (sourceWords && Array.isArray(sourceWords)) {
        for (var j = 0; j < sourceWords.length; j++) {
          var word = sourceWords[j];
          var text = word && word.WordText !== undefined ? String(word.WordText).trim() : '';
          var box = bbox.pixelBoxFromWord(word);
          if (text && box) {
            lineWords.push({ text: text, box: box });
          }
        }
      }
      var textObject = toTextObject(lineWords, dimensions);
      if (textObject) {
        texts.push(textObject);
      }
    }
    if (texts.length > 0) {
      return texts;
    }
  }
  return buildParsedTextFallback(parsedResult);
}

function buildParsedTextFallback(parsedResult) {
  var parsedText = parsedResult && parsedResult.ParsedText ? String(parsedResult.ParsedText) : '';
  if (!parsedText.trim()) {
    return [];
  }
  return parsedText
    .split(/\r?\n/)
    .map(function (line) { return line.trim(); })
    .filter(function (line) { return line.length > 0; })
    .map(function (line) { return { text: line }; });
}

function groupByRows(words) {
  var heights = words.map(function (word) { return word.box.height; });
  var threshold = clamp(median(heights) * 0.75, 6, 60);
  var sorted = words.slice().sort(function (a, b) {
    if (Math.abs(a.box.cy - b.box.cy) > threshold) {
      return a.box.cy - b.box.cy;
    }
    return a.box.left - b.box.left;
  });
  var rows = [];
  sorted.forEach(function (word) {
    var best = null;
    var bestDistance = Infinity;
    rows.forEach(function (row) {
      var distance = Math.abs(word.box.cy - row.cy);
      if (distance < bestDistance && distance <= threshold) {
        best = row;
        bestDistance = distance;
      }
    });
    if (!best) {
      best = { cy: word.box.cy, words: [] };
      rows.push(best);
    }
    best.words.push(word);
    best.cy = best.words.reduce(function (sum, item) { return sum + item.box.cy; }, 0) / best.words.length;
  });
  return rows.sort(function (a, b) {
    return a.cy - b.cy;
  });
}

function buildHorizontalTexts(parsedResult, dimensions) {
  var words = extractWords(parsedResult);
  if (words.length === 0) {
    return buildParsedTextFallback(parsedResult);
  }
  return groupByRows(words).map(function (row) {
    row.words.sort(function (a, b) {
      return a.box.left - b.box.left;
    });
    return toTextObject(row.words, dimensions);
  }).filter(Boolean);
}

function verticalColumnThreshold(words, dimensions) {
  var medianWidth = median(words.map(function (word) { return word.box.width; }));
  var medianHeight = median(words.map(function (word) { return word.box.height; }));
  var imageWidth = dimensions.pixelWidth || 0;
  var maxThreshold = imageWidth > 0 ? imageWidth * 0.08 : 80;
  return clamp(Math.max(medianWidth * 1.5, medianHeight * 0.45), 8, maxThreshold);
}

function groupByVerticalColumns(words, dimensions) {
  var threshold = verticalColumnThreshold(words, dimensions);
  var sorted = words.slice().sort(function (a, b) {
    if (Math.abs(a.box.cx - b.box.cx) > threshold) {
      return b.box.cx - a.box.cx;
    }
    return a.box.cy - b.box.cy;
  });
  var columns = [];
  sorted.forEach(function (word) {
    var best = null;
    var bestDistance = Infinity;
    columns.forEach(function (column) {
      var distance = Math.abs(word.box.cx - column.cx);
      if (distance < bestDistance && distance <= threshold) {
        best = column;
        bestDistance = distance;
      }
    });
    if (!best) {
      best = { cx: word.box.cx, words: [] };
      columns.push(best);
    }
    best.words.push(word);
    best.cx = best.words.reduce(function (sum, item) { return sum + item.box.cx; }, 0) / best.words.length;
  });
  return columns.sort(function (a, b) {
    return b.cx - a.cx;
  });
}

function buildVerticalRlTexts(parsedResult, dimensions) {
  var words = extractWords(parsedResult);
  if (words.length === 0) {
    return buildParsedTextFallback(parsedResult);
  }
  if (isCoarseOverlay(words) && parsedResult && parsedResult.ParsedText && String(parsedResult.ParsedText).trim()) {
    // Coarse overlay: word-level text is unreliable, but we can still use
    // word coordinates for boundingBox. Use ParsedText for text content
    // and attach a combined boundingBox from all word coordinates.
    var allBoxes = words.map(function (word) { return word.box; });
    var unionBox = bbox.unionPixelBoxes(allBoxes);
    var normalizedUnion = bbox.normalizePixelBox(unionBox, dimensions.pixelWidth, dimensions.pixelHeight);
    var parsedLines = String(parsedResult.ParsedText)
      .split(/\r?\n/)
      .map(function (line) { return line.trim(); })
      .filter(function (line) { return line.length > 0; });
    if (parsedLines.length === 0) {
      return [];
    }
    // If we have a valid union box and multiple lines, distribute evenly
    // across the box (approximation for coarse overlay)
    return parsedLines.map(function (line, index) {
      var textObject = { text: line };
      if (normalizedUnion && parsedLines.length > 0) {
        // For vertical RL text, each line is a column from right to left
        // Distribute columns evenly across the union box width
        var pts = normalizedUnion.points;
        var fullLeft = pts[0].x;
        var fullRight = pts[1].x;
        var topY = pts[0].y;
        var bottomY = pts[2].y;
        var colWidth = (fullRight - fullLeft) / parsedLines.length;
        // Columns go right-to-left
        var colRight = fullRight - colWidth * index;
        var colLeft = colRight - colWidth;
        textObject.boundingBox = {
          points: [
            { x: colLeft, y: topY },
            { x: colRight, y: topY },
            { x: colLeft, y: bottomY },
            { x: colRight, y: bottomY }
          ]
        };
      }
      textObject._pixelBox = unionBox;
      return textObject;
    });
  }
  return groupByVerticalColumns(words, dimensions).map(function (column) {
    column.words.sort(function (a, b) {
      if (Math.abs(a.box.cy - b.box.cy) > 2) {
        return a.box.cy - b.box.cy;
      }
      return b.box.cx - a.box.cx;
    });
    return toTextObject(column.words, dimensions);
  }).filter(Boolean);
}

function looksVertical(words, dimensions) {
  if (!words || words.length < 3) {
    return false;
  }
  if (isCoarseOverlay(words)) {
    return false;
  }
  var columns = groupByVerticalColumns(words, dimensions).filter(function (column) {
    return column.words.length >= 2;
  });
  var rows = groupByRows(words).filter(function (row) {
    return row.words.length >= 2;
  });
  var medianWidth = median(words.map(function (word) { return word.box.width; }));
  var medianHeight = median(words.map(function (word) { return word.box.height; }));
  return columns.length >= 2 && columns.length >= rows.length && medianHeight >= medianWidth * 0.7;
}

function chooseLayout(parsedResult, options, languageInfo, dimensions) {
  if (options.layoutMode !== 'auto') {
    return options.layoutMode;
  }
  var words = extractWords(parsedResult);
  if (words.length === 0) {
    return 'service';
  }
  if (looksVertical(words, dimensions)) {
    return 'vertical_rl';
  }
  return 'horizontal';
}

function buildTexts(parsedResult, options, languageInfo, dimensions) {
  var layoutMode = chooseLayout(parsedResult, options, languageInfo, dimensions);
  var words = extractWords(parsedResult);
  var texts;
  if (layoutMode === 'vertical_rl') {
    texts = buildVerticalRlTexts(parsedResult, dimensions);
  } else if (layoutMode === 'horizontal') {
    texts = buildHorizontalTexts(parsedResult, dimensions);
  } else {
    texts = buildServiceTexts(parsedResult, dimensions);
  }
  return {
    layoutMode: layoutMode,
    usedParsedTextFallback: layoutMode === 'vertical_rl' && isCoarseOverlay(words),
    texts: stripInternalFields(texts),
    pixelBox: bbox.unionPixelBoxes(texts.map(function (text) { return text._pixelBox; }))
  };
}

module.exports = {
  extractWords: extractWords,
  hasOverlayWords: hasOverlayWords,
  buildTexts: buildTexts,
  buildServiceTexts: buildServiceTexts,
  buildHorizontalTexts: buildHorizontalTexts,
  buildVerticalRlTexts: buildVerticalRlTexts,
  groupByRows: groupByRows,
  groupByVerticalColumns: groupByVerticalColumns,
  isCoarseOverlay: isCoarseOverlay,
  looksVertical: looksVertical,
  joinWords: joinWords,
  median: median,
  verticalColumnThreshold: verticalColumnThreshold
};
