'use strict';

function finiteNumber(value) {
  var num = Number(value);
  return isFinite(num) ? num : undefined;
}

function clamp01(value) {
  if (value < 0) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  return value;
}

function pixelBoxFromWord(word) {
  if (!word) {
    return undefined;
  }
  var left = finiteNumber(word.Left);
  var top = finiteNumber(word.Top);
  var width = finiteNumber(word.Width);
  var height = finiteNumber(word.Height);
  if (left === undefined || top === undefined || width === undefined || height === undefined || width <= 0 || height <= 0) {
    return undefined;
  }
  return {
    left: left,
    top: top,
    right: left + width,
    bottom: top + height,
    width: width,
    height: height,
    cx: left + width / 2,
    cy: top + height / 2
  };
}

function normalizePixelBox(box, pixelWidth, pixelHeight) {
  var width = finiteNumber(pixelWidth);
  var height = finiteNumber(pixelHeight);
  if (!box || !width || !height || width <= 0 || height <= 0) {
    return undefined;
  }
  var x1 = clamp01(box.left / width);
  var y1 = clamp01(box.top / height);
  var x2 = clamp01(box.right / width);
  var y2 = clamp01(box.bottom / height);
  return {
    points: [
      { x: x1, y: y1 },
      { x: x2, y: y1 },
      { x: x1, y: y2 },
      { x: x2, y: y2 }
    ]
  };
}

function unionPixelBoxes(boxes) {
  if (!boxes || boxes.length === 0) {
    return undefined;
  }
  var left = Infinity;
  var top = Infinity;
  var right = -Infinity;
  var bottom = -Infinity;
  boxes.forEach(function (box) {
    if (!box) {
      return;
    }
    if (box.left < left) {
      left = box.left;
    }
    if (box.top < top) {
      top = box.top;
    }
    if (box.right > right) {
      right = box.right;
    }
    if (box.bottom > bottom) {
      bottom = box.bottom;
    }
  });
  if (!isFinite(left) || !isFinite(top) || !isFinite(right) || !isFinite(bottom) || right <= left || bottom <= top) {
    return undefined;
  }
  return {
    left: left,
    top: top,
    right: right,
    bottom: bottom,
    width: right - left,
    height: bottom - top,
    cx: (left + right) / 2,
    cy: (top + bottom) / 2
  };
}

module.exports = {
  clamp01: clamp01,
  pixelBoxFromWord: pixelBoxFromWord,
  normalizePixelBox: normalizePixelBox,
  unionPixelBoxes: unionPixelBoxes
};

