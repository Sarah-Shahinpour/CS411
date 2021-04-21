const express = require('express');
const router = express.Router();

// home index
router.get('/', function(req, res, next) {
    res.status(200).json({ message: 'Welcome to our 411 Project, this is the API we made'});
});

module.exports = router;
