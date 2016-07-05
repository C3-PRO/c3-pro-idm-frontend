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

module.exports = config;
