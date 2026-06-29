'use strict';

var errors = require('./errors');

var OCRSPACE_LANG_MAP = {
  auto: 'auto',
  ja: 'jpn',
  en: 'eng',
  'zh-Hans': 'chs',
  'zh-Hant': 'cht',
  ko: 'kor',
  fr: 'fre',
  de: 'ger',
  es: 'spa',
  it: 'ita',
  ru: 'rus',
  pt: 'por',
  nl: 'dut',
  pl: 'pol',
  ar: 'ara',
  tr: 'tur',
  uk: 'ukr',
  vi: 'vnm',
  th: 'tha',
  fi: 'fin',
  sv: 'swe',
  da: 'dan',
  el: 'gre',
  hu: 'hun',
  cs: 'cze',
  bg: 'bul',
  hr: 'hrv',
  sl: 'slv'
};

function supportLanguages() {
  return Object.keys(OCRSPACE_LANG_MAP);
}

function mapBobLanguage(code) {
  if (!code) {
    return undefined;
  }
  return OCRSPACE_LANG_MAP[code];
}

/**
 * Resolve the OCR language to send to OCR.space, following Bob's standard:
 *
 * - query.from: the user-selected source language, may be 'auto'
 * - query.detectFrom: Bob's best guess of the image language, never 'auto'
 *
 * Logic:
 * 1. If from !== 'auto' and has a mapping → use it directly
 * 2. If from === 'auto':
 *    - Engine 2/3 support OCR.space auto → send language='auto'
 *    - Engine 1 does not support auto → fallback to detectFrom mapping
 * 3. result.from always returns a concrete Bob language code (never 'auto')
 */
function resolveOcrLanguage(query, options) {
  var from = (query && query.from) || 'auto';
  var detectFrom = (query && query.detectFrom) || undefined;
  var engine = options.engine;

  // Case 1: User specified a concrete source language
  if (from !== 'auto') {
    var ocrLang = mapBobLanguage(from);
    if (ocrLang && ocrLang !== 'auto') {
      return { language: ocrLang, from: from };
    }
    // The user selected a language we don't have a mapping for
    return {
      error: errors.serviceError(
        'unsupportedLanguage',
        'Unsupported OCR language: ' + from,
        'No OCR.space mapping for Bob language code "' + from + '"'
      )
    };
  }

  // Case 2: from === 'auto'
  if (engine === '2' || engine === '3') {
    // Engine 2/3 support OCR.space auto-detection
    return { language: 'auto', from: detectFrom || 'auto' };
  }

  // Case 3: Engine 1 does not support auto → use detectFrom as fallback
  if (detectFrom) {
    var fallbackLang = mapBobLanguage(detectFrom);
    if (fallbackLang && fallbackLang !== 'auto') {
      return { language: fallbackLang, from: detectFrom };
    }
  }

  return {
    error: errors.serviceError(
      'unsupportedLanguage',
      'Engine 1 does not support automatic language detection',
      'Please select Engine 2 or 3, or manually choose a source language in Bob.'
    )
  };
}

function isJapanese(languageInfo) {
  return !!languageInfo && (languageInfo.language === 'jpn' || languageInfo.from === 'ja');
}

module.exports = {
  OCRSPACE_LANG_MAP: OCRSPACE_LANG_MAP,
  supportLanguages: supportLanguages,
  mapBobLanguage: mapBobLanguage,
  resolveOcrLanguage: resolveOcrLanguage,
  isJapanese: isJapanese
};
