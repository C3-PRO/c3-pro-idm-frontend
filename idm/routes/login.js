var express = require('express');
var router = express.Router();
var config = require('../utils.js');
//var service_oauth = require('../services/oauth');
var service_jwt = require('../services/jwt');

/* GET home page. */
router.get('/', function(req, res, next) {
    if (req.session.token) {
        res.redirect('/subjects');
    }
    else {
        var title = (config.app && config.app.login_title) ? config.app.login_title : 'IDM Login';
        res.render('login', {title: title, destination: req.query.dest});
    }
});

/* POST for log in*/
router.post('/', function(req, res, next) {
    var opt = {
        "username": req.body.username,
        "password": req.body.password,
        "sess": req.session,
        "res": res,
    };
    // TODO: check config to decide between OAuth2 or JWT
    //service_oauth.oauth(opt, function(username, token, sess) {
    service_jwt.jwt(opt, function(username, token, sess) {
        sess.username = username;
        sess.token = token;
        console.log('token: ', token);
        res.redirect(req.body.destination ? req.body.destination : '/subjects');
    });
});

module.exports = router;
