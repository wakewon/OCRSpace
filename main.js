'use strict';

var config = require('./lib/config');
var language = require('./lib/language');
var ocrspace = require('./lib/ocrspace');

function supportLanguages() {
  return language.supportLanguages();
}

function supportBoundingBox() {
  return true;
}

function pluginTimeoutInterval() {
  return config.getTimeoutOption();
}

function ocr(query, completion) {
  ocrspace.runOcr(query, completion);
}

function pluginValidate(completion) {
  ocrspace.pluginValidate(completion);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    supportLanguages: supportLanguages,
    supportBoundingBox: supportBoundingBox,
    pluginTimeoutInterval: pluginTimeoutInterval,
    ocr: ocr,
    pluginValidate: pluginValidate
  };
}

