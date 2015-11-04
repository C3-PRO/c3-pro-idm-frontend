var express = require('express');

var app = express();
var config = require('./config.dev.json');

if (app.get('env') === 'qa') {
    config = require('./config.qa.json');
} else if (app.get('env') === 'prod') {
    config = require('./config.prod.json');
}

module.exports = config;