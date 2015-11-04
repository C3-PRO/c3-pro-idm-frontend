var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    var sess=req.session;
    if (sess.username) {
        res.redirect('/patients');
    } else {
        res.render('login', {title: 'IDM'});
    }
});

/* POST for log in*/

router.post('/', function(req, res, next) {
    var sess=req.session;
    sess.username = req.body.username;
    sess.password = req.body.password;
    res.redirect('/patients');
});

module.exports = router;