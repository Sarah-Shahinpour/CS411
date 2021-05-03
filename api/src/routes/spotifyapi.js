/* read this to see how we're transferring data between front and back end
https://www.webucator.com/how-to/how-send-receive-json-data-from-the-server.cfm */

/* taken from Spotify Web API template and integrated into our routes for /spotifyapi
   WIll have all spotify related api calls, server to server authenication will to be checked and refreshed if needed
   on every request recieved. Every api call will require a session id to response, either in the form of a 
   client session id (without our app account) or user-login session id (with our app account). Client session id is 
   acquired as soon as a connection is made */
const express = require('express'); // Express web server framework
const request = require('request'); // "Request" library
const querystring = require('querystring');
const router = express.Router();

/* Autherication & Authorization */
const config = require('../config/config');
var client_id = config.spotify.SPOTIFY_CLIENTID; // Your client id
var client_secret = config.spotify.SPOTIFY_SECRETID; // Your secret
var redirect_uri = config.spotify.callback; // Your redirect uri

/* Use redis for cache */
const redis= require('./redis');

// uses sessionId to directly access user schema when adding/using spotify user refresh token 
const User = require('../models/user');

var stateKey = 'spotify_auth_state';
var sessionId = 'sessionId';

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

/* complete server to server client credentials with spotify api */
/* request access token if we don't have one in cache */
function checkAndAcquireServerToken(req, res, next){
    /* make sure we have a spotify api token before entering the route */
    redis.get('spotifyServerAccessToken', (err, data) => {
        if(err) throw err;

        if(data != null){
            next();
        }else{
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
                    console.log('***Went through spotify api client credential flow***');
                    
                    //save token in redis cache, access token should be valid for 1 hour for OAuth 2.0
                    redis.setex('spotifyServerAccessToken', 3600, body.access_token);
                    next();
                } else{
                    res.json({error: 'Unable to get access token'});
                    next();
                }
            });
        }
    });
}

/* login to spotify without account */
router.get('/login/', function(req, res) {
    var state = generateRandomString(16);
    res.cookie(stateKey, state);
    /* id is used to identify users not logged in to our app in cache */
    var id = generateRandomString(32);
    res.cookie(sessionId, id);

    /* requests authorization */
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

/* need to fix */
function checkUserRefreshToken(req, res, next){
    var id = req.params.id;
    redis.get('UserSession:'+id, (err, data)=>{
        if(err) {
            console.log('Invalid user session id detected!');
            res.json({message : 'Error, invalid session'});
        }
        User.findOne({session : data}, function(error, user){
            if(error){
                console.log('unable to find user schema when checking refresh token for spotify');
                //401 Unauthorized or 403 : Forbidden
                res.status(401).json({message : 'Unable to add spotify to account!'}); 
            }
            //check if user has refresh token (only does if login to spotift before)
            if(user != null){
                if(user.havespotify){
                    //we checked cache already, so if we're here, it means we have refresh token but no access token
                    var authOptions = {
                        url: 'https://accounts.spotify.com/api/token',
                        headers: { 'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64'))},
                        form: {
                            grant_type: 'refresh_token',
                            refresh_token: user.refreshtoken
                        },
                        json: true
                    };
                    request.post(authOptions, function(error, response, body) {
                        if (!error && response.statusCode === 200) {
                            var access_token = body.access_token;
                            //save to cache & output
                            redis.setex(id+':spotifyUserAccessToken', 360, access_token);
                            res.redirect('http://localhost:3000?' + querystring.stringify({access_token : access_token}));
                        } else{
                            res.send({'access_token': "error"});
                        }
                    });
                }else{
                    next();
                }
            }else{
                console.log('unable to find user schema when checking refresh token for spotify');
                res.status(401).json({message : 'Unable to add spotify to account!'}); 
            }
        });
    });
}

/* login to spotify when login to application */
router.get('/loginWithAcc/:id/', checkUserRefreshToken, function(req, res) {
    //set a random string as state, this helps prevent Cross-site scripting attacks
    //CAN BE MODIFIED MORE FOR OUR OWN SECURITY MEASURES
    var state = generateRandomString(16);
    res.cookie(stateKey, state);

    /* we expect a valid login session id to map access token to */
    var id = req.params.id;
    res.cookie(sessionId, id);
    res.cookie('haveAccount', true);

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

/* callback from login or loginWithAcc */
router.get('/callback', function(req, res) {
    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;
    var storedId = req.cookies ? req.cookies[sessionId] : null;

    // use the authorication_code provided to us in response to obtain the user's access token and refresh token
    if (state === null || state !== storedState) {
        res.json({error: "INVALID statekey"});
    } else {
        res.clearCookie(stateKey);
        res.clearCookie(sessionId);

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

                // print the information of your spotify account to console. ***REMOVE IN PRODUCTION***
                var options = {
                    url: 'https://api.spotify.com/v1/me',
                    headers: { 'Authorization': 'Bearer ' + access_token },
                    json: true
                };
                request.get(options, function(error, response, body) {
                    console.log(body);
                });

                redis.setex(storedId+':spotifyUserAccessToken', 3600, access_token);
               
                //WARNING!!! INSECURE, shouldn't be sending access token
                /* Better approach would be to encrypt the access token using a random generated key, give the key to user and save 
                encrypted access token in cache, when user make spotify api calls, they pass in the key and we decrypt and use the
                access token! Can integrate after testing (if have time) */
                //res.status(200).json({access_token : body.access_token, rest : JSON.stringify(body)});
                res.redirect('http://localhost:3000?' + querystring.stringify({sessionId : storedId}));
            } else {
                res.json({error: 'invalid_token'});
            }
        });
    }
});

/* log out */
router.get('/logout', function(req, res){
    res.redirect('https://spotify.com/logout');
});

/* routes that use server access token  */
router.get('/nr', checkAndAcquireServerToken, function(req, res) { 
    redis.get('spotifyServerAccessToken', (err, data) => {
        if(err) throw err;

        if(data != null){
            var options = {
                'url': 'https://api.spotify.com/v1/browse/new-releases',
                'headers': {
                  'Authorization': 'Bearer ' + data
                },
                json : true
              };
              request.get(options, function (error, response) {
                if (error) throw new Error(error);
                
                //output the album and author names,
                console.log(response.body);
                //res.send(response.body);
                res.status(200).send(JSON.stringify(response.body));
              });
        }else{
            console.log('Error, no token');
            res.status(204).json({error : 'Server Error!'});
        }
    });
});

/* get featured playlist of spotify */
router.get('/featuredplaylist', checkAndAcquireServerToken, function(req, res){
    redis.get('spotifyServerAccessToken', (err, data)=>{
        if(err) throw err;

        if(data != null){
            var options = {
                'url': 'https://api.spotify.com/v1/browse/featured-playlists',
                'headers': {
                    'Authorization': 'Bearer ' + data,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            };
            request.get(options, function (error, response) {
                if (error) throw new Error(error);
                console.log(response.body);
                res.status(200).send(JSON.stringify(response.body));
            });
        }else{
            console.log('Error, no token');
            res.status(204).json({error : 'Server Error!'});
        }
    });
});

/* search for an item */
router.post('/search', checkAndAcquireServerToken, function(req, res){
    /* Types: album , artist, playlist, track, show and episode. */
    var type = req.body.type || null;
    var query = req.body.q || null;

    redis.get('spotifyServerAccessToken', (err, data)=>{
        if(err) throw err;

        if(data != null){
            var options = {
                'url': 'https://api.spotify.com/v1/search?q='+query+'&type='+type,
                'headers': {
                  'Authorization': 'Bearer ' + data,
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                }
              };
              request.get(options, function (error, response) {
                if (error) throw new Error(error);
                console.log(response.body);
                res.status(200).send(JSON.stringify(response.body));
              });
              
        }else{
            console.log('Error, no token');
            res.status(204).json({error : 'Server Error!'});
        }
    });
});

/* show all available genres on spotify */
router.get('/genre', checkAndAcquireServerToken, function(req, res){
    redis.get('spotifyServerAccessToken', (err, data)=>{
        if(err) throw err;

        if(data != null){
            var options = {
                'url': 'https://api.spotify.com/v1/recommendations/available-genre-seeds',
                'headers': {
                  'Authorization': 'Bearer ' + data,
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                }
              };
              request.get(options, function (error, response) {
                if (error) throw new Error(error);
                console.log(response.body);
                res.status(200).send(JSON.stringify(response.body));
              });
              
        }else{
            console.log('Error, no token');
            res.status(204).json({error : 'Server Error!'});
        }
    });
});

/* show all available categories on spotify */
router.get('/categories', checkAndAcquireServerToken, function(req, res){
    redis.get('spotifyServerAccessToken', (err, data)=>{
        if(err) throw err;

        if(data != null){
            var options = {
                'url': 'https://api.spotify.com/v1/browse/categories',
                'headers': {
                  'Authorization': 'Bearer ' + data,
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                }
              };
              request.get(options, function (error, response) {
                if (error) throw new Error(error);
                console.log(response.body);
                res.status(200).send(JSON.stringify(response.body));
              });
              
        }else{
            console.log('Error, no token');
            res.status(204).json({error : 'Server Error!'});
        }
    });
});

/* find artist then display everything about them */
router.get('/artists/:name', checkAndAcquireServerToken, function(req, res){
    let artist = req.params.name;
    redis.get('spotifyServerAccessToken', (err, data)=>{
        if(err) throw err;

        if(data != null){
            var options = {
                'url': 'https://api.spotify.com/v1/search?q='+artist+'&type=artist',
                'headers': {
                  'Authorization': 'Bearer ' + data,
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                }
              };
              request.get(options, function (error, response) {
                if (error) throw new Error(error);
                console.log(response.body);
                res.status(200).send(JSON.stringify(response.body));
              });
              
        }else{
            console.log('Error, no token');
            res.status(204).json({error : 'Server Error!'});
        }
    });
});

/* find track then display everything about them */
router.get('/tracks/:song', checkAndAcquireServerToken, function(req, res){
    let song = req.params.song;
    redis.get('spotifyServerAccessToken', (err, data)=>{
        if(err) throw err;

        if(data != null){
            var options = {
                'url': 'https://api.spotify.com/v1/search?q='+song+'&type=track',
                'headers': {
                  'Authorization': 'Bearer ' + data,
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                }
              };
              request.get(options, function (error, response) {
                if (error) throw new Error(error);
                console.log(response.body);
                res.status(200).send(JSON.stringify(response.body));
              });
        }else{
            console.log('Error, no token');
            res.status(204).json({error : 'Server Error!'});
        }
    });
});

/* find recommendations based on favorite artists, genre and tracks */
router.get('/recommendation', checkAndAcquireServerToken, function(req, res){
    var artists = req.query.artists || null;
    var genre = req.query.genre || null;
    var tracks = req.query.tracks || null;
    redis.get('spotifyServerAccessToken', (err, data)=>{
        if(err) throw err;

        if(data != null){
            var options = {
                'method': 'GET',
                'url': 'https://api.spotify.com/v1/recommendations?seed_artists=' +artists +'&seed_genres='+genre+'&seed_tracks=' + tracks,
                'headers': {
                  'Authorization': 'Bearer ' + data
                }
              };
              request(options, function (error, response) {
                if (error) throw new Error(error);
                res.status(200).send(JSON.stringify(response.body));
              });
                
        }else{
            console.log('Error, no token');
            res.status(204).json({error : 'Server Error!'});
        }
    });
});

/* Check if user has access token in redis cache */
function checkUserAccessTokenCache(req, res, next){
    var id = escape(req.body.sessionId);
    redis.get(id+':spotifyUserAccessToken', (err, data) => {
        if(err) throw err;
        if(data != null){
            //res.status(200).send(data);
            next();
        }else{
            res.status(204).send({error : 'incorrect sessionId'});
        }
    });
}

// used a golbal variable atoken for Access Token
router.get('/newplaylist', checkUserAccessTokenCache, function(req, res) {
    var sessionId = req.body.sessionId;
    var userID = req.body.userId;
    redis.get(sessionId+':spotifyUserAccessToken', (err, data)=>{
        if(err) throw err;

        if(data != null){
            var options = {
                'url': 'https://api.spotify.com/v1/users/' + userID + '/playlists',
                'headers': {
                    'Authorization': 'Bearer ' + data,
                    'Content-Type': 'application/json'
                },
                'body': {
                    'name': 'cool stuff'
                },
                json: true 
            };
        
            request.post(options, function (error, response, body) {
                if (!error && (response.statusCode === 200 || response.statusCode === 201)) {
                    console.log(response.body);
                    
                    //save client into redis cache, access token should be valid for 1 hour for OAuth 2.0
                    res.status(200).send(response.body.id);
                } else{
                    res.send(response.body);
                }
            });
                
        }else{
            console.log('Error, no token');
            res.status(204).json({error : 'Server Error!'});
        }
    });
});

router.post('/additems', checkUserAccessTokenCache, function(req, res) {
    var pid = req.body.playlistID || null;
    var uris = req.body.uris || null;
    var sessionId = req.body.sessionId || null;

    console.log(pid);

    redis.get(sessionId+':spotifyUserAccessToken', (err, data)=>{
        if(err) throw err;

        if(data != null){
            var options = {
                'url': 'https://api.spotify.com/v1/playlists/' + pid + '/tracks?uris=' + uris,
                'headers': {
                    'Authorization': 'Bearer ' + atoken,
                    'Content-Type': 'application/json'
                },
                json: true 
            };
        
            request.post(options, function (error, response, body) {
                if (!error && (response.statusCode === 200 || response.statusCode === 201)) {
                    console.log(response.body);
                    
                    res.send(response.body);
                } else{
                    res.send(response.body);
                }
            });
                
        }else{
            console.log('Error, no token');
            res.status(204).json({error : 'Server Error!'});
        }
    });
    
});

module.exports = router;
