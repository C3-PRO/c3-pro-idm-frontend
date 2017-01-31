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
        var title = config.app ? config.app.login_title : null;
        // TODO: decide between oauth and JWT
        var base = (config.jwt.protocol || 'https') + "://" + config.jwt.host + (config.jwt.port ? ':' + config.jwt.port : '');
        var forgot = base + config.jwt.forgot_password;
        res.render('login', {
            title: title,
            destination: req.query.dest,
            forgot_password: forgot});
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
    service_jwt.jwt(opt, function(username, token, sess, error) {
        if (error) {
            var title = config.app ? config.app.login_title : null;
            var base = (config.jwt.protocol || 'https') + "://" + config.jwt.host + (config.jwt.port ? ':' + config.jwt.port : '');
            var forgot = null;
            if (config.jwt.forgot_password) {
                forgot = (config.jwt.forgot_password.indexOf('//') >= 0) ? config.jwt.forgot_password : base + config.jwt.forgot_password;
            }
            res.render('login', {
                title: title,
                destination: req.body.destination,
                username: username,
                errmessage: error,
                forgot_password: forgot});
        }
        else {
            sess.username = username;
            sess.token = token;
            res.redirect(req.body.destination ? req.body.destination : '/subjects');
        }
    });
});

module.exports = router;
