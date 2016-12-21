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
 *  Returns an object that contains `statusCode` and either `data` (filled with
 *  response data passed through the optional `manipulateFuncOnSuccess`
 *  argument) or `errorMessage`.
 */
config.dataOrErrorFromJSONResponse = function(error, response, body, manipulateFuncOnSuccess) {
    var json = {
        statusCode: response.statusCode,
    };
    var parsed = body ? JSON.parse(body) : {};
    if (response.statusCode < 400) {
        var manipulated = manipulateFuncOnSuccess ? manipulateFuncOnSuccess(parsed) : parsed;
        json.data = ('data' in manipulated) ? manipulated.data : manipulated;
    }
    else {
        json.errorMessage = (parsed.error && parsed.error.message) ? parsed.error.message : error;
    }
    return json;
}

module.exports = config;
