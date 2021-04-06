/* taken from Spotify Web API template and integrated into our routes for /auth */
const express = require('express'); // Express web server framework
const request = require('request'); // "Request" library
const querystring = require('querystring');
const router = express.Router();

/* Autherication & Authorization */
const config = require('../config/config');
var client_id = config.spotify.SPOTIFY_CLIENTID; // Your client id
var client_secret = config.spotify.SPOTIFY_SECRETID; // Your secret
var redirect_uri = config.spotify.callback; // Your redirect uri

var send_response = 0; // used to see if we render view or send response back
var stateKey = 'spotify_auth_state';
/**
* Generates a random string containing numbers and letters
* @param  {number} length The length of the string
* @return {string} The generated string
*/
var generateRandomString = function(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

router.get('/server', function(req, res) {
    var options = {
        'url': 'https://accounts.spotify.com/api/token',
        'headers': {
            'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64')),
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        form: {
            'grant_type': 'client_credentials'
        },
        json: true 
    };
  
    request.post(options, function (error, response, body) {
        if (!error && response.statusCode === 200) {
            var state = generateRandomString(16);
            res.cookie(stateKey, state);
            console.log(response.body);
            if(send_response){
            res.status(200).json({access_token : response});
            } else{
            res.render('user', {titleheader: 'serverLogin', access_token : body.access_token, 
            refresh_token : 'no refresh_token for server to server connection', 
            state: state});
            }
        } else{
            if(send_response){
            res.json({error: 'Unable to connect to spotify api'});
            } else{
            res.render('error', {message : 'unable to connect to spotify api with client credentials'});
            }
        }
    });
});

router.get('/login', function(req, res) {
    //set a random string as state, this helps prevent Cross-site scripting attacks
    //CAN BE MODIFIED MORE FOR OUR OWN SECURITY MEASURES
    var state = generateRandomString(16);
    res.cookie(stateKey, state);

    // your application requests authorization
    var scope = 'user-read-private user-read-email';
    res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
    }));
});

router.get('/callback', function(req, res) {
    // your application requests refresh and access tokens
    // after checking the state parameter
    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;

    //after user logins, we use the authorication_code provided to us in response to obtain the user's access token and refresh token
    if (state === null || state !== storedState) {
        res.json({error: "INVALID statekey"});
    } else {
        res.clearCookie(stateKey);
        var authOptions = {
            url: 'https://accounts.spotify.com/api/token',
            form: {
            code: code,
            redirect_uri: redirect_uri,
            grant_type: 'authorization_code'
            },
            headers: {
            'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))
            },
            json: true
        };

        //make a request call
        request.post(authOptions, function(error, response, body) {
            //callback from request call
            if (!error && response.statusCode === 200) {
            var access_token = body.access_token,
                refresh_token = body.refresh_token;

            var options = {
                url: 'https://api.spotify.com/v1/me',
                headers: { 'Authorization': 'Bearer ' + access_token },
                json: true
            };

            // use the access token to access the Spotify Web API
            request.get(options, function(error, response, body) {
                console.log(body);
            });

            // we can also pass the token to the browser to make requests from there
            if(send_response){
                res.status(200).json({req_body: body});
            } else{
                res.render('user', {titleheader: 'userLogin',access_token : body.access_token, 
                refresh_token : body.refresh_token, 
                state: state});
            }
            } else {
                if(send_response){
                res.json({error: 'invalid_token'});
                } else{
                res.render('error', {message : 'unable to connect to spotify api with user login credentials'});
                } 
            }
        });
    }
});

router.get('/refresh_token/:id', function(req, res) {
    // requesting access token from refresh token
    var refresh_token = req.params.id;
    console.log(refresh_token);
    var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        headers: { 'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))},
        form: {
            grant_type: 'refresh_token',
            refresh_token: refresh_token
        },
        json: true
    };

    request.post(authOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {
            var access_token = body.access_token;
            res.send({
            'access_token': access_token
            });
        } else{
            res.send({'access_token': "error"});
        }
    });
});

/* Have access token */
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
