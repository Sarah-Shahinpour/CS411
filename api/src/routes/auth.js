const express = require('express');
const router = express.Router();

const Login = require('../models/login');
const User = require('../models/user');
const config = require('../config/config');

/* import crypto-js */
const CryptoJS = require('crypto-js');

// retrieve user data
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

//login
router.post('/userlogin', (req, res, next)=>{
    //inputs, x-www-form-urlencoded in body
    var myusername = escape(req.body.username);
    var password = escape(req.body.password);

    Login.findOne({username : myusername}, function(err, userLogin){
        if(userLogin == null){
            console.log('Error! ' + myusername + ' tried to login using password ' + password);
            //401 Unauthorized or 403 : Forbidden
            res.status(401).json({message : 'Error! Username or password is incorrect.'}); 
        } else{
            const saltedHash = CryptoJS.SHA256(config.crypto.salt+userLogin.rsalt+password);
            if(saltedHash == userLogin.getpassword){
                User.findOne({_id : userLogin.getkey}, function(error, user){
                    if(error){
                        console.log('Error! ' + myusername + ' tried to login using password ' + password);
                        //401 Unauthorized or 403 : Forbidden
                        res.status(401).json({message : 'Error! Username or password is incorrect.'}); 
                    }
                    res.status(200).json({refresh_token : user.refreshtoken});
                });
            }else{
                console.log('Error! ' + myusername + ' tried to login using password ' + password);
                //401 Unauthorized or 403 : Forbidden
                res.status(401).json({message : 'Error! Username or password is incorrect.'}); 
            }
        }
    });
});

//add user with spotify token
router.post('/userWithSpotify', (req, res, next)=>{
    //inputs, x-www-form-urlencoded in body.
    var myusername = req.body.username;
    var password = req.body.password;
    var email = req.body.email;
    var refreshToke = req.body.refresh_Token;
    Login.find({username : myusername}, function(err, userlogins){
        //then we can continue to make the acc
        if(userlogins.length != 0){
            console.log('Error! Username was already taken.');
            res.status(401).json({message : 'username was already taken!! Please try again'});
        } else{
            //create user
            let newUser = new User({
                spotify:{
                    havespotify: true,
                    spotifytoken: refreshToke
                }
            });
            newUser.save((err, user)=>{
                if(err){
                    console.log(err);
                    res.status(401).json({msg: 'Failed to add user with User Schema!', error : err});
                }else{
                    //successfully created User schema, now Login schema
                    var rsalt = CryptoJS.lib.WordArray.random(16);
                    var saltedHash = CryptoJS.SHA256(config.crypto.salt+rsalt+password);
                    let newLogin = new Login({
                        username: myusername,
                        password: saltedHash,
                        email : email,
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
                            res.status(401).json({message : 'Error! Unable to make account at this time.'});
                        }else{
                            res.status(200).json({msg: 'User added successfully'});
                        }
                    });
                }
            });
        }
    });
});

// add user data, no spotify refresh token
router.post('/user', (req, res, next)=>{
    //inputs, x-www-form-urlencoded in body.
    var myusername = req.body.username;
    var password = req.body.password;
    var email = req.body.email;

    //check if username is unique
    Login.find({username : myusername}, function(err, userlogins){
        //then we can continue to make the acc
        if(userlogins.length != 0){
            console.log('Error! Username was already taken.');
            res.status(400).json({message : 'username was already taken!!'});
        } else{
            //create user
            let newUser = new User({
                spotify:{
                    havespotify: false,
                }
            });
            newUser.save((err, user)=>{
                if(err){
                    console.log(err);
                    res.status(400).json({msg: 'Failed to add user with User Schema!', error : err});
                }else{
                    //successfully created User schema, now Login schema
                    var rsalt = CryptoJS.lib.WordArray.random(16);
                    var saltedHash = CryptoJS.SHA256(config.crypto.salt+rsalt+password);
                    let newLogin = new Login({
                        username: myusername,
                        password: saltedHash,
                        email : email,
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
                            res.status(400);
                        }else{
                            res.status(200).json({msg: 'User added successfully'});
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
