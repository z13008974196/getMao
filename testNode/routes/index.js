var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
      host: 'http://106.15.207.29/'
  });
});

module.exports = router;
