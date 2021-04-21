const express = require('express');
const router = express.Router();

const Login = require('../models/login');
const User = require('../models/users');
const config = require('../config/config');

/* import crypto-js */
const CryptoJS = require('crypto-js');

// retrieve user data
router.get('/', (req, res, next) => {
    Login.find(function(err, userlogins){
        res.status(200).json(userlogins);
    })
});
/*
function checkUsername(req, res, next){
    Login.find({username : myusername}, function(err, userlogins){
}*/

// add user data ** need to fix **
router.post('/user', (req, res, next)=>{
    var myusername = req.body.username;
    var password = req.body.password;
    var email = req.body.email;

    //check if username is unique
    Login.find({username : myusername}, function(err, userlogins){
        //then we can continue to make the acc
        if(userlogins.length != 0){
            console.log('Error! Username was already taken.');
            res.status(300).json({message : 'username was already taken!!'});
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
                    res.status(305).json({msg: 'Failed to add user with User Schema!', error : err});
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
                            res.status(304);
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
router.delete('/user/', (req, res, next)=> {
    const username = req.body.username;
    Login.findOne({username : username}, function(error, data){
        if(error){
            console.log("error had occur when finding username");
            res.status(200).json({error : error});
        }else{
            User.deleteOne({_id : data.key}, function(err2, result2){
                if(err2){
                    console.log("error when deleting user schema" );
                    res.status(200).json({error : err2});
                }else{
                    console.log("successfully deleted user schema");
                    Login.deleteOne({username: username}, function(err, result){
                        if(err){
                            console.log("error when deleting login schema" );
                            res.status(200).json({error0 : err2, error : err});
                        } else{
                            console.log("successfully deleted login schema");
                            res.status(200).json({result0 : result2, result : result});
                        }
                    });
                }
            });
        }
    });   
});

module.exports = router;
