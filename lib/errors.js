'use strict';

function serviceError(type, message, addition, troubleshootingLink) {
  var error = {
    type: type || 'unknown',
    message: message || 'Unknown error'
  };
  if (addition) {
    error.addition = String(addition);
  }
  if (troubleshootingLink) {
    error.troubleshootingLink = troubleshootingLink;
  }
  return error;
}

function stringifyValue(value) {
  if (value === undefined || value === null || value === '') {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch (e) {
    return String(value);
  }
}

function joinDetails(details) {
  var parts = [];
  var key;
  for (key in details) {
    if (Object.prototype.hasOwnProperty.call(details, key)) {
      var value = stringifyValue(details[key]);
      if (value) {
        parts.push(key + '=' + value);
      }
    }
  }
  return parts.join('; ');
}

function fromHttpResponse(resp, context) {
  var statusCode = resp && resp.response ? resp.response.statusCode : undefined;
  var addition = joinDetails({
    status: statusCode,
    engine: context && context.engine,
    language: context && context.language,
    response: resp && resp.data
  });
  return serviceError('api', statusCode ? 'OCR.space HTTP error (' + statusCode + ')' : 'OCR.space request failed', addition);
}

function fromNetworkError(error, context) {
  return serviceError('network', 'Network request failed', joinDetails({
    engine: context && context.engine,
    language: context && context.language,
    error: error
  }));
}

function fromOcrSpace(data, context) {
  var message = data && (data.ErrorMessage || data.ErrorDetails) || 'OCR.space processing failed';
  var addition = joinDetails({
    engine: context && context.engine,
    language: context && context.language,
    OCRExitCode: data && data.OCRExitCode,
    IsErroredOnProcessing: data && data.IsErroredOnProcessing,
    ErrorMessage: data && data.ErrorMessage,
    ErrorDetails: data && data.ErrorDetails
  });
  return serviceError('api', stringifyValue(message), addition);
}

module.exports = {
  serviceError: serviceError,
  joinDetails: joinDetails,
  fromHttpResponse: fromHttpResponse,
  fromNetworkError: fromNetworkError,
  fromOcrSpace: fromOcrSpace
};

