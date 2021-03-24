const express = require('express');
const router = express.Router();

// home index
router.get('/', function(req, res, next) {
    return res.status(200).json({ message: 'Welcome to our 411 Project' });
  });

module.exports = router;
