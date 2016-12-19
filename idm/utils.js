var express = require('express');

var app = express();
var config = null;

if (app.get('env') === 'qa') {
    config = require('./config.qa.json');
}
else if (app.get('env') === 'prod') {
    config = require('./config.prod.json');
}
else {
    config = require('./config.dev.json');
}

/**
 *  Returns an object that contains `statusCode` and either `body` (filled with
 *  response data passed through the optional `manipulateFuncOnSuccess`
 *  argument) or `error`.
 */
config.dataBodyOrErrorFromJSONResponse = function(error, response, body, manipulateFuncOnSuccess) {
    var data = {
        statusCode: response.statusCode,
    };
    var parsed = body ? JSON.parse(body) : {};
    if (response.statusCode < 400) {
        data.body = manipulateFuncOnSuccess ? manipulateFuncOnSuccess(parsed) : parsed;
    }
    else {
        data.error = (parsed.error && parsed.error.message) ? parsed.error.message : error;
    }
    return data;
}

module.exports = config;
