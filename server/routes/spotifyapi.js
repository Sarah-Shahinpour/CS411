const express = require('express');
const router = express.Router();
const fetch = require("node-fetch");

var redirect_uri = 'locathost:3000';
var my_client_id = 'b3098bd2d517442995f3dbdaea624113';
var my_secret_id = '765cfcc072624a928dae2992492f18cd';
var access_token;

router.get('/auth', function(req, res) {
    const Url='https://accounts.spotify.com/api/token';
    const auth_id = my_client_id + ":" + my_secret_id;
    var myHeaders = new fetch.Headers();
    myHeaders.append("authorization", "Basic YjMwOThiZDJkNTE3NDQyOTk1ZjNkYmRhZWE2MjQxMTM6NzY1Y2ZjYzA3MjYyNGE5MjhkYWUyOTkyNDkyZjE4Y2Q=");
    myHeaders.append("Content-Type", "application/x-www-form-urlencoded");
    myHeaders.append("Cookie", "__Host-device_id=AQCQENYGuZ1MxwlJzZHoVSeYkOUL3e4_jP128pCtFaD9my9F38QCI-R9qDlErp3AtATd1EyY4mPWhHSbyJaSk9eZ_6ivis8pty0");
    
    var urlencoded = new URLSearchParams();
    urlencoded.append("grant_type", "client_credentials");
    
    var requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: urlencoded,
      redirect: 'follow'
    };
    
    fetch("https://accounts.spotify.com/api/token", requestOptions)
      .then(response => response.text())
      .then(result => console.log('result', result))
      .catch(error => console.log('error', error));
    
      console.log(access_token);
});
router.get('/login', function(req, res) {
    // set up variables
    var scopes = 'user-read-private user-read-email';
    res.redirect('https://accounts.spotify.com/authorize' +
      '?response_type=code' +
      '&client_id=' + my_client_id +
      (scopes ? '&scope=' + encodeURIComponent(scopes) : '') +
      '&redirect_uri=' + encodeURIComponent(redirect_uri));
});

module.exports = router;
