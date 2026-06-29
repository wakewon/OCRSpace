'use strict';

var errors = require('./errors');

var DEFAULTS = {
  engine: '3',
  layoutMode: 'auto',
  overlay: 'true',
  scale: 'false',
  detectOrientation: 'false',
  isTable: 'false',
  timeout: 120,
  returnRaw: 'false'
};

function optionStore() {
  if (typeof $option !== 'undefined' && $option) {
    return $option;
  }
  return {};
}

function getOption(key, defaultValue) {
  var opts = optionStore();
  var value = opts[key];
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  return String(value);
}

function getBooleanOption(key, defaultValue) {
  var value = getOption(key, defaultValue ? 'true' : 'false').toLowerCase();
  if (value === 'true' || value === '1' || value === 'yes' || value === 'on' || value === 'enable') {
    return true;
  }
  if (value === 'false' || value === '0' || value === 'no' || value === 'off' || value === 'disable') {
    return false;
  }
  return !!defaultValue;
}

function asApiBoolean(value) {
  return value ? 'true' : 'false';
}

function getApiKey(apiKeys) {
  if (!apiKeys) {
    return '';
  }
  var keys = String(apiKeys)
    .split(',')
    .map(function (key) { return key.trim(); })
    .filter(function (key) { return key.length > 0; });
  if (keys.length === 0) {
    return '';
  }
  return keys[Math.floor(Math.random() * keys.length)];
}

function parseJsonObject(key) {
  var raw = getOption(key, '');
  if (!raw || raw.trim() === '' || raw.trim() === '{}') {
    return { value: {} };
  }
  try {
    var parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {
        error: errors.serviceError('param', key + ' must be a JSON object', raw)
      };
    }
    return { value: parsed };
  } catch (e) {
    return {
      error: errors.serviceError('param', key + ' is not valid JSON', e.message)
    };
  }
}

function clampNumber(value, min, max, defaultValue) {
  var num = Number(value);
  if (!isFinite(num)) {
    return defaultValue;
  }
  if (num < min) {
    return min;
  }
  if (num > max) {
    return max;
  }
  return num;
}

function getTimeoutOption() {
  return clampNumber(getOption('timeout', DEFAULTS.timeout), 30, 300, DEFAULTS.timeout);
}

function readOptions() {
  var engine = getOption('engine', DEFAULTS.engine);
  if (engine !== '1' && engine !== '2' && engine !== '3') {
    return { error: errors.serviceError('param', 'OCREngine must be 1, 2, or 3', 'engine=' + engine) };
  }

  var layoutMode = getOption('layoutMode', DEFAULTS.layoutMode);
  if (['auto', 'service', 'horizontal', 'vertical_rl'].indexOf(layoutMode) < 0) {
    return { error: errors.serviceError('param', 'Invalid layout mode', 'layoutMode=' + layoutMode) };
  }

  var extraBodyResult = parseJsonObject('extraBody');
  if (extraBodyResult.error) {
    return { error: extraBodyResult.error };
  }

  var apiKeys = getOption('apiKey', '');
  var apiKey = getApiKey(apiKeys);
  if (!apiKey) {
    return { error: errors.serviceError('secretKey', 'Please configure an OCR.space API key') };
  }

  return {
    value: {
      apiKey: apiKey,
      engine: engine,
      layoutMode: layoutMode,
      overlay: getBooleanOption('overlay', DEFAULTS.overlay === 'true'),
      scale: getBooleanOption('scale', DEFAULTS.scale === 'true'),
      detectOrientation: getBooleanOption('detectOrientation', DEFAULTS.detectOrientation === 'true'),
      isTable: getBooleanOption('isTable', DEFAULTS.isTable === 'true'),
      timeout: getTimeoutOption(),
      extraBody: extraBodyResult.value,
      returnRaw: getBooleanOption('returnRaw', DEFAULTS.returnRaw === 'true')
    }
  };
}

function buildApiBooleanOptions(options) {
  return {
    isOverlayRequired: asApiBoolean(options.overlay),
    scale: asApiBoolean(options.scale),
    detectOrientation: asApiBoolean(options.detectOrientation),
    isTable: asApiBoolean(options.isTable)
  };
}

module.exports = {
  DEFAULTS: DEFAULTS,
  getOption: getOption,
  getApiKey: getApiKey,
  getTimeoutOption: getTimeoutOption,
  readOptions: readOptions,
  buildApiBooleanOptions: buildApiBooleanOptions,
  parseJsonObject: parseJsonObject,
  clampNumber: clampNumber
};
