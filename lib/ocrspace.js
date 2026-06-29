'use strict';

var config = require('./config');
var language = require('./language');
var layout = require('./layout');
var bbox = require('./bounding-box');
var errors = require('./errors');

var OCR_ENDPOINT = 'https://api.ocr.space/parse/image';
var VALIDATE_IMAGE_BASE64 = 'data:image/png;base64,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';
var TROUBLESHOOTING_URL = 'https://ocr.space/ocrapi';

function safeJsonParse(data) {
  if (!data || typeof data !== 'string') {
    return data;
  }
  try {
    return JSON.parse(data);
  } catch (e) {
    return undefined;
  }
}

function mergeBody(base, extra) {
  var merged = {};
  var key;
  for (key in base) {
    if (Object.prototype.hasOwnProperty.call(base, key)) {
      merged[key] = base[key];
    }
  }
  for (key in extra) {
    if (Object.prototype.hasOwnProperty.call(extra, key)) {
      merged[key] = extra[key];
    }
  }
  return merged;
}

function buildRequestBody(options, languageInfo) {
  var body = {
    language: languageInfo.language,
    OCREngine: options.engine
  };
  var booleanOptions = config.buildApiBooleanOptions(options);
  body.isOverlayRequired = booleanOptions.isOverlayRequired;
  body.scale = booleanOptions.scale;
  body.detectOrientation = booleanOptions.detectOrientation;
  body.isTable = booleanOptions.isTable;
  return mergeBody(body, options.extraBody || {});
}

function imageDataToBase64Image(imageData) {
  if (!imageData || !imageData.toBase64) {
    return '';
  }
  var base64 = imageData.toBase64();
  if (!base64) {
    return '';
  }
  if (/^data:/i.test(base64)) {
    return base64;
  }
  return 'data:image/png;base64,' + base64;
}

function buildImageBody(query, options, languageInfo) {
  var body = buildRequestBody(options, languageInfo);
  body.base64Image = imageDataToBase64Image(query.image);
  return body;
}

function pageHasUsableContent(parsedResult) {
  if (!parsedResult) {
    return false;
  }
  if (layout.hasOverlayWords(parsedResult)) {
    return true;
  }
  return !!(parsedResult.ParsedText && String(parsedResult.ParsedText).trim());
}

function isSuccessfulPage(parsedResult) {
  return parsedResult && Number(parsedResult.FileParseExitCode) === 1 && pageHasUsableContent(parsedResult);
}

function buildPageRegion(parsedResult, query, options, languageInfo) {
  var dimensions = {
    pixelWidth: query.pixelWidth || 0,
    pixelHeight: query.pixelHeight || 0
  };
  var built = layout.buildTexts(parsedResult, options, languageInfo, dimensions);
  if (!built.texts || built.texts.length === 0) {
    return undefined;
  }
  var region = {
    paragraphInfos: [{
      texts: built.texts
    }]
  };
  var regionBox = bbox.normalizePixelBox(built.pixelBox, dimensions.pixelWidth, dimensions.pixelHeight);
  if (regionBox) {
    region.boundingBox = regionBox;
  }
  return region;
}

function summarizePageErrors(parsedResults) {
  if (!parsedResults || !parsedResults.length) {
    return '';
  }
  var messages = [];
  parsedResults.forEach(function (page, index) {
    if (Number(page.FileParseExitCode) === 1) {
      return;
    }
    messages.push('page ' + (index + 1) + ': code=' + page.FileParseExitCode + ', message=' + (page.ErrorMessage || page.ErrorDetails || ''));
  });
  return messages.join('; ');
}

function parseOcrSpaceResponse(data, query, options, languageInfo) {
  var parsed = safeJsonParse(data);
  if (!parsed) {
    return { error: errors.serviceError('api', 'Unable to parse OCR.space response') };
  }

  var context = {
    engine: options.engine,
    language: languageInfo.language
  };
  var exitCode = Number(parsed.OCRExitCode);
  var parsedResults = parsed.ParsedResults || [];

  if (parsed.IsErroredOnProcessing && exitCode !== 2) {
    return { error: errors.fromOcrSpace(parsed, context) };
  }
  if (exitCode !== 1 && exitCode !== 2) {
    return { error: errors.fromOcrSpace(parsed, context) };
  }
  if (!Array.isArray(parsedResults) || parsedResults.length === 0) {
    return { error: errors.serviceError('notFound', 'OCR.space returned no parsed results') };
  }

  var regionInfos = [];
  parsedResults.forEach(function (page) {
    if (!isSuccessfulPage(page)) {
      return;
    }
    var region = buildPageRegion(page, query, options, languageInfo);
    if (region) {
      regionInfos.push(region);
    }
  });

  if (regionInfos.length === 0) {
    var pageErrors = summarizePageErrors(parsedResults);
    return {
      error: errors.serviceError(
        pageErrors ? 'api' : 'notFound',
        pageErrors ? 'OCR.space did not parse any page successfully' : 'No text found',
        errors.joinDetails({
          OCRExitCode: parsed.OCRExitCode,
          pageErrors: pageErrors
        })
      )
    };
  }

  var result = {
    from: languageInfo.from || query.detectFrom || query.from || 'auto',
    regionInfos: regionInfos
  };
  if (options.returnRaw) {
    result.raw = parsed;
  }
  return { result: result };
}

function httpRequest(params) {
  if (typeof $http === 'undefined' || !$http || !$http.request) {
    throw new Error('Bob $http.request is not available');
  }
  $http.request(params);
}

function runOcr(query, completion) {
  var optionsResult = config.readOptions();
  if (optionsResult.error) {
    completion({ error: optionsResult.error });
    return;
  }
  var options = optionsResult.value;
  var languageInfo = language.resolveOcrLanguage(query, options);
  if (languageInfo.error) {
    completion({ error: languageInfo.error });
    return;
  }

  var body = buildImageBody(query, options, languageInfo);
  if (!body.base64Image) {
    completion({ error: errors.serviceError('param', 'Unable to read image data') });
    return;
  }
  var context = {
    engine: options.engine,
    language: languageInfo.language
  };

  if (typeof $log !== 'undefined' && $log && $log.info) {
    $log.info('[OCR.space] engine=' + options.engine + ', language=' + languageInfo.language + ', layout=' + options.layoutMode + ', overlay=' + options.overlay + ', image=base64Image');
  }

  httpRequest({
    method: 'POST',
    url: OCR_ENDPOINT,
    header: {
      apikey: options.apiKey,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: body,
    timeout: options.timeout,
    handler: function (resp) {
      if (resp && resp.error) {
        completion({ error: errors.fromNetworkError(resp.error, context) });
        return;
      }
      if (resp && resp.response && resp.response.statusCode >= 400) {
        completion({ error: errors.fromHttpResponse(resp, context) });
        return;
      }
      var parsed = parseOcrSpaceResponse(resp && resp.data, query, options, languageInfo);
      completion(parsed);
    }
  });
}

function validateOptionsForPluginValidate() {
  var optionsResult = config.readOptions();
  if (optionsResult.error) {
    return optionsResult;
  }
  var options = optionsResult.value;
  var languageInfo = { language: 'eng', from: 'en' };
  return {
    value: {
      options: options,
      languageInfo: languageInfo,
      body: mergeBody({
        base64Image: VALIDATE_IMAGE_BASE64,
        language: 'eng',
        OCREngine: options.engine,
        isOverlayRequired: 'false',
        scale: 'false',
        detectOrientation: 'false',
        isTable: 'false'
      }, options.extraBody || {})
    }
  };
}

function pluginValidate(completion) {
  var validation = validateOptionsForPluginValidate();
  if (validation.error) {
    completion({
      result: false,
      error: validation.error
    });
    return;
  }
  var options = validation.value.options;
  var context = {
    engine: options.engine,
    language: 'eng'
  };
  httpRequest({
    method: 'POST',
    url: OCR_ENDPOINT,
    header: {
      apikey: options.apiKey
    },
    body: validation.value.body,
    timeout: options.timeout,
    handler: function (resp) {
      if (resp && resp.error) {
        completion({
          result: false,
          error: errors.serviceError('network', 'OCR.space validation request failed', errors.joinDetails({ error: resp.error }), TROUBLESHOOTING_URL)
        });
        return;
      }
      if (resp && resp.response && resp.response.statusCode >= 400) {
        completion({
          result: false,
          error: errors.serviceError('api', 'OCR.space validation HTTP error', errors.joinDetails({ status: resp.response.statusCode, response: resp.data }), TROUBLESHOOTING_URL)
        });
        return;
      }
      var parsed = safeJsonParse(resp && resp.data);
      if (parsed && (Number(parsed.OCRExitCode) === 1 || Number(parsed.OCRExitCode) === 2)) {
        completion({ result: true });
        return;
      }
      completion({
        result: false,
        error: errors.fromOcrSpace(parsed || {}, context)
      });
    }
  });
}

module.exports = {
  OCR_ENDPOINT: OCR_ENDPOINT,
  VALIDATE_IMAGE_BASE64: VALIDATE_IMAGE_BASE64,
  buildRequestBody: buildRequestBody,
  buildImageBody: buildImageBody,
  imageDataToBase64Image: imageDataToBase64Image,
  parseOcrSpaceResponse: parseOcrSpaceResponse,
  validateOptionsForPluginValidate: validateOptionsForPluginValidate,
  runOcr: runOcr,
  pluginValidate: pluginValidate
};
