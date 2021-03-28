const express = require('express');
const router = express.Router();
const request = require('request');

router.get('/nr/:token', function(req, res, next) { 
    var options = {
      'url': 'https://api.spotify.com/v1/browse/new-releases',
      'headers': {
        'Authorization': 'Bearer ' + req.params.token
      },
      json : true
    };
    request.get(options, function (error, response) {
      if (error) throw new Error(error);
      
      //output the album and author names,
      console.log(response.body);
      //res.send(response.body);
      res.render("display", {data : JSON.stringify(response.body)});
    });
});

module.exports = router;
