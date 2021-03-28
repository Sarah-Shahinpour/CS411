const express = require('express');
const router = express.Router();

// home index
router.get('/', function(req, res, next) {
  res.render('index', {title : 'index', message : 'hi from index'});
  //res.status(200).json({ message: 'Welcome to our 411 Project' });
});

router.get('/callback', function (req, res) {
  res.render('index', {title : 'index callback', message : 'hi from index callback'});
  //res.status(200).json({ title: 'This is index', message: 'Callback to index!' })
});
module.exports = router;
