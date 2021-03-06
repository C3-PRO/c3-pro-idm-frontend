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
        res.render('login', {
            title: title,
            destination: req.query.dest,
            forgot_password: forgotPasswordURL()});
    }
});

/* POST for log in*/
router.post('/', function(req, res, next) {
    var opt = {
        username: req.body.username,
        password: req.body.password,
        sess: req.session,
        res: res,
    };
    // TODO: check config to decide between OAuth2 or JWT
    //service_oauth.oauth(opt, function(username, token, sess) {
    service_jwt.jwt(opt, function(username, token, sess, error) {
        if (error) {
            var title = config.app ? config.app.login_title : null;
            
            res.render('login', {
                title: title,
                destination: req.body.destination,
                username: username,
                errmessage: error,
                forgot_password: forgotPasswordURL()});
        }
        else {
            sess.username = username;
            sess.token = token;
            res.redirect(req.body.destination ? req.body.destination : '/subjects');
        }
    });
});

function forgotPasswordURL() {
    if (config.jwt.forgot_password) {
        if (config.jwt.forgot_password.indexOf('://') >= 0) {
            return config.jwt.forgot_password;
        }
        var base = (config.jwt.protocol || 'https') + '://' + config.jwt.host + (config.jwt.port ? ':' + config.jwt.port : '');
        return base + config.jwt.forgot_password;
    }
    return null;
}

module.exports = router;
