'use strict';

var assert = require('assert');
var fs = require('fs');
var path = require('path');

var config = require('../lib/config');
var language = require('../lib/language');
var bbox = require('../lib/bounding-box');
var layout = require('../lib/layout');
var ocrspace = require('../lib/ocrspace');
var main = require('../main');

function fixture(name) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', name), 'utf8'));
}

function withOptions(options, fn) {
  global.$option = options;
  try {
    return fn();
  } finally {
    delete global.$option;
  }
}

function test(name, fn) {
  try {
    fn();
    process.stdout.write('ok - ' + name + '\n');
  } catch (error) {
    process.stderr.write('not ok - ' + name + '\n');
    throw error;
  }
}

test('supportLanguages contains core Bob languages', function () {
  var langs = main.supportLanguages();
  ['auto', 'ja', 'en', 'zh-Hans', 'zh-Hant'].forEach(function (lang) {
    assert.ok(langs.indexOf(lang) >= 0, lang);
  });
  assert.strictEqual(main.supportBoundingBox(), true);
});

test('language mapping and Engine auto handling', function () {
  assert.strictEqual(language.mapBobLanguage('ja'), 'jpn');
  assert.strictEqual(language.mapBobLanguage('zh-Hans'), 'chs');

  var engine23 = language.resolveOcrLanguage(
    { from: 'auto', detectFrom: 'ja' },
    { engine: '3' }
  );
  assert.strictEqual(engine23.language, 'auto');

  var manualJa = language.resolveOcrLanguage(
    { from: 'ja', detectFrom: 'en' },
    { engine: '3' }
  );
  assert.strictEqual(manualJa.language, 'jpn');
  assert.strictEqual(manualJa.from, 'ja');

  var engine1 = language.resolveOcrLanguage(
    { from: 'auto', detectFrom: 'ja' },
    { engine: '1' }
  );
  assert.strictEqual(engine1.language, 'jpn');

  var unsupported = language.resolveOcrLanguage(
    { from: 'auto', detectFrom: undefined },
    { engine: '1' }
  );
  assert.strictEqual(unsupported.error.type, 'unsupportedLanguage');

  // When from='auto' and engine 1, it uses detectFrom as fallback
  var engine1Fallback = language.resolveOcrLanguage(
    { from: 'auto', detectFrom: 'en' },
    { engine: '1' }
  );
  assert.strictEqual(engine1Fallback.language, 'eng');
  assert.strictEqual(engine1Fallback.from, 'en');
});

test('config validates JSON and clamps timeout', function () {
  withOptions({ apiKey: 'a,b', timeout: '999', extraBody: '{}', engine: '3' }, function () {
    var options = config.readOptions();
    assert.ifError(options.error);
    assert.strictEqual(options.value.timeout, 300);
    assert.ok(['a', 'b'].indexOf(options.value.apiKey) >= 0);
  });

  withOptions({ apiKey: 'a', timeout: '5', extraBody: '{"x":1}', engine: '3' }, function () {
    var options = config.readOptions();
    assert.ifError(options.error);
    assert.strictEqual(options.value.timeout, 30);
    assert.deepStrictEqual(options.value.extraBody, { x: 1 });
  });

  withOptions({ apiKey: 'a', extraBody: '{bad', engine: '3' }, function () {
    var options = config.readOptions();
    assert.strictEqual(options.error.type, 'param');
  });
});

test('OCR.space request body carries resolved language', function () {
  var body = ocrspace.buildRequestBody({
    engine: '3',
    overlay: true,
    scale: true,
    detectOrientation: false,
    isTable: false,
    filetype: 'auto',
    extraBody: {}
  }, { language: 'jpn', from: 'ja' });
  assert.strictEqual(body.language, 'jpn');
  assert.strictEqual(body.OCREngine, '3');
  assert.strictEqual(body.isOverlayRequired, 'true');
});

test('OCR.space image body uses base64Image with OCR parameters', function () {
  var imageData = {
    toBase64: function () {
      return 'abc123';
    }
  };
  var body = ocrspace.buildImageBody({ image: imageData }, {
    engine: '1',
    overlay: true,
    scale: true,
    detectOrientation: false,
    isTable: false,
    filetype: 'auto',
    extraBody: {}
  }, { language: 'jpn', from: 'ja' });
  assert.strictEqual(body.language, 'jpn');
  assert.strictEqual(body.OCREngine, '1');
  assert.strictEqual(body.base64Image, 'data:image/png;base64,abc123');
});

test('bounding boxes normalize and clamp', function () {
  var wordBox = bbox.pixelBoxFromWord({ Left: 10, Top: 20, Width: 50, Height: 10 });
  var normalized = bbox.normalizePixelBox(wordBox, 200, 100);
  assert.deepStrictEqual(normalized.points, [
    { x: 0.05, y: 0.2 },
    { x: 0.3, y: 0.2 },
    { x: 0.05, y: 0.3 },
    { x: 0.3, y: 0.3 }
  ]);

  var clamped = bbox.normalizePixelBox({ left: -10, top: -5, right: 250, bottom: 120 }, 200, 100);
  assert.deepStrictEqual(clamped.points, [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 }
  ]);
  assert.strictEqual(bbox.normalizePixelBox(wordBox, 0, 100), undefined);
});

test('horizontal layout orders rows and words', function () {
  var data = fixture('mock-ocrspace-horizontal.json');
  var texts = layout.buildHorizontalTexts(data.ParsedResults[0], { pixelWidth: 200, pixelHeight: 100 });
  assert.strictEqual(texts.length, 2);
  assert.strictEqual(texts[0].text, 'Hello World');
  assert.strictEqual(texts[1].text, 'Line Two');
  assert.ok(texts[0].boundingBox);
});

test('vertical_rl orders Japanese columns right-to-left', function () {
  var data = fixture('mock-ocrspace-vertical.json');
  var texts = layout.buildVerticalRlTexts(data.ParsedResults[0], { pixelWidth: 200, pixelHeight: 100 });
  assert.strictEqual(texts.length, 2);
  assert.strictEqual(texts[0].text, 'あい');
  assert.strictEqual(texts[1].text, 'うえ');
  assert.ok(texts[0].boundingBox.points[0].x > texts[1].boundingBox.points[0].x);
});

test('vertical_rl preserves boundingBox for coarse Engine 3 overlay', function () {
  var data = fixture('mock-ocrspace-coarse-overlay.json');
  var texts = layout.buildVerticalRlTexts(data.ParsedResults[0], { pixelWidth: 471, pixelHeight: 760 });
  assert.strictEqual(texts.length, 3);
  assert.strictEqual(texts[0].text, '「俺が?」');
  assert.strictEqual(texts[1].text, 'すると美和は尾上の顔をじっと覗き込んだ。無言のまま、不自然なくらい長く。');
  // boundingBox should now be present (was undefined before the fix)
  assert.ok(texts[0].boundingBox, 'coarse overlay texts should have boundingBox');
  assert.ok(texts[0].boundingBox.points, 'boundingBox should have points');
  assert.strictEqual(texts[0].boundingBox.points.length, 4);
  // First column should be rightmost (vertical RL)
  assert.ok(texts[0].boundingBox.points[0].x > texts[2].boundingBox.points[0].x,
    'first column should be to the right of last column');
  assert.strictEqual(layout.isCoarseOverlay(layout.extractWords(data.ParsedResults[0])), true);
});

test('parseOcrSpaceResponse returns regionInfos and raw only when requested', function () {
  var data = fixture('mock-ocrspace-vertical.json');
  var options = {
    engine: '3',
    layoutMode: 'vertical_rl',
    returnRaw: false
  };
  var languageInfo = { language: 'jpn', from: 'ja' };
  var parsed = ocrspace.parseOcrSpaceResponse(data, { pixelWidth: 200, pixelHeight: 100 }, options, languageInfo);
  assert.ifError(parsed.error);
  assert.strictEqual(parsed.result.from, 'ja');
  assert.strictEqual(parsed.result.regionInfos.length, 1);
  assert.strictEqual(parsed.result.regionInfos[0].paragraphInfos[0].texts[0].text, 'あい');
  assert.strictEqual(parsed.result.raw, undefined);
});

test('parseOcrSpaceResponse omits boxes without image dimensions', function () {
  var data = fixture('mock-ocrspace-horizontal.json');
  var options = {
    engine: '2',
    layoutMode: 'horizontal',
    returnRaw: false
  };
  var parsed = ocrspace.parseOcrSpaceResponse(data, {}, options, { language: 'eng', from: 'en' });
  assert.ifError(parsed.error);
  assert.strictEqual(parsed.result.regionInfos[0].paragraphInfos[0].texts[0].boundingBox, undefined);
});

test('metadata files are consistent', function () {
  var info = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'info.json'), 'utf8'));
  var appcast = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'appcast.json'), 'utf8'));
  assert.strictEqual(info.identifier, appcast.identifier);
  assert.strictEqual(info.minBobVersion, '1.20.0');
  assert.strictEqual(appcast.versions[0].version, info.version);
  assert.match(info.identifier, /^[a-z0-9]+(\.[a-z0-9]+)+$/);
});

process.stdout.write('All tests passed.\n');
