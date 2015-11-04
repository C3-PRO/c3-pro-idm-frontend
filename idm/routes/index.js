var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  var sess=req.session;
  if (sess.username) {
    // there is a valid session. Lets redirect to patients lists
    res.redirect('/patients');
  } else {
    res.redirect('/login');
  }

});

module.exports = router;
