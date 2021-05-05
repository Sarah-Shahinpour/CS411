const express = require('express');
const router = express.Router();

const Login = require('../models/login');
const User = require('../models/user');
const config = require('../config/config');

const redis = require('./redis');
/* import crypto-js */
const CryptoJS = require('crypto-js');
const querystring = require('querystring');

var generateRandomString = function(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

// retrieve user login data, require id as passcode, set in config
router.get('/users/:id', (req, res, next) => {
    var _id = req.params.id;
    if(_id == config.crypto.admin){
        Login.find(function(err, userlogins){
            if(err){
                res.status(200).json(err);
            }
            res.status(200).json(userlogins);
        });
    }else{
        console.log('ID ' + _id + ' TRIED TO REQUEST LOGIN DATA!!!');
        next(); //gives back 404 response
    }
});

//login, username and password required in the body
router.post('/userlogin', (req, res, next)=>{
    //inputs, x-www-form-urlencoded in body
    var myusername = req.body.username;
    var password = req.body.password;
    myusername = escape(myusername);
    password = escape(password);

    Login.findOne({username : myusername}, function(err, userLogin){
        if(userLogin == null){
            console.log('Error! ' + myusername + ' tried to login using password ' + password);
            //401 Unauthorized or 403 : Forbidden
            res.status(401).json({'message' : 'Error! Username or password is incorrect.'}); 
        } else{
            const saltedHash = CryptoJS.SHA256(config.crypto.salt+userLogin.rsalt+password);
            if(saltedHash == userLogin.getpassword){
                User.findOne({_id : userLogin.getkey}, function(error, user){
                    if(error){
                        console.log('Error! ' + myusername + ' tried to login using password ' + password);
                        //401 Unauthorized or 403 : Forbidden
                        res.status(401).json({message : 'Error! Username or password is incorrect.'}); 
                    }
                    let sessionId = generateRandomString(16);
                    let sess = generateRandomString(8)
                    user.updateSession = sess;
                    /* saves session for a day */
                    redis.setex('UserSession:'+sessionId, 43200, sess);
                    user.save();
                    const response = {
                        "message" : '',
                        sessionId : sessionId
                    };
                    res.json(response);
                    //res.redirect('http://localhost:3000?' + querystring.stringify({sessionId : storedId}));
                });
            }else{
                console.log('Error! ' + myusername + ' tried to login using password ' + password);
                //401 Unauthorized or 403 : Forbidden
                res.status(401).json({'message' : 'Error! Username or password is incorrect.'}); 
            }
        }
    });
});

// add user data, NOTE if we want to add spotify to acc, we make account first, then request user login
// if the user has previously login to spotify, we'll ignore redis cache and send req to spotify anyways, then save refresh_token
router.post('/user', (req, res, next)=>{
    //inputs, x-www-form-urlencoded in body.
    var myusername = req.body.username || null;
    var password = req.body.password|| null;
    var email = req.body.email|| null;

    if(myusername == null || password == null || email == null){
        res.status(400).json({message : 'Failed to add user'});
    }
    //check if username is unique
    Login.find({username : myusername}, function(err, userlogins){
        //then we can continue to make the acc
        if(userlogins.length != 0){
            console.log('Error! Username was already taken.');
            res.status(400).json({message : 'username was already taken!!'});
        } else{
            //create user & user session ID
            var session = generateRandomString(8);
            var sessionId = generateRandomString(16);
            redis.setex('UserSession:'+sessionId, 43200, session);
            let newUser = new User({
                spotify:{
                    havespotify: false,
                },
                session : session
            });

            newUser.save((err, user)=>{
                if(err){
                    console.log(err);
                    res.status(400).json({msg: 'Failed to add user', error : err});
                }else{
                    //successfully created User schema, now Login schema
                    var rsalt = CryptoJS.lib.WordArray.random(16);
                    let escapedPassword = escape(password);
                    var saltedHash = CryptoJS.SHA256(config.crypto.salt+rsalt+escapedPassword);
                    
                    let escapedUsername = escape(myusername);
                    let escapedEmail = escape(email);
                    let newLogin = new Login({
                        username: escapedUsername,
                        password: saltedHash,
                        email : escapedEmail,
                        rsalt : rsalt,
                        key : user._id
                    });
                    newLogin.save((err, userLogin)=>{
                        if(err){
                            console.log('Unable to create login schema!');
                            // delete User schema 
                            User.delete({username : myusername}, function(err, result){
                                if(err){
                                    console.log("Unable to delete user Schema made, oops?");
                                }
                            });
                            res.status(400).json({msg: 'Failed to add user', error : err});
                        }else{
                            res.status(200).json({msg: 'User added successfully', sessionId : sessionId});
                        }
                    });
                }
            });
        }
    });
});

//delete contacts, maybe require authenication?
router.delete('/user/:username', (req, res, next)=> {
    const username = req.params.username;
    Login.findOne({username : username}, function(error, data){
        if(error){
            console.log("error had occur when finding username");
            res.status(200).json({error : 'Error in removing the user, please try again in a little!'});
        }else{
            User.deleteOne({_id : data.key}, function(err2, result2){
                if(err2){
                    console.log("error when deleting user schema" );
                    res.status(200).json({error : 'Error in removing the user, please try again in a little!'});
                }else{
                    console.log("successfully deleted user schema");
                    Login.deleteOne({username: username}, function(err, result){
                        if(err){
                            console.log("error when deleting login schema" );
                            res.status(200).json({error : 'Error in removing the user, please try again in a little!'});
                        } else{
                            console.log("successfully deleted login schema");
                            res.status(200).json({message : 'Successfully removed your account!'});
                        }
                    });
                }
            });
        }
    });   
});

module.exports = router;
