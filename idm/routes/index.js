var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    var sess = req.session;
    if (sess.token) {
        // there is a valid session. Lets redirect to subjects lists
        res.redirect('/subjects');
    }
    else {
        res.redirect('/login');
    }
});

module.exports = router;
