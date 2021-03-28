const express = require('express');
const router = express.Router();

const User = require('../models/users');

// retrieve user data
router.get('/users', (req, res, next) => {
    User.find(function(err, users){
        res.status(200).json(users);
    })
});

// add user data
router.post('/users', (req, res, next)=>{
    let newUser = new User({
        username: req.body.username,
        password: req.body.password
    });

    newUser.save((err, user)=>{
        if(err){
            res.status(200).json({msg: 'Failed to add user'});
        }else{
            res.status(200).json({msg: 'User added successfully'});
        }
    });
});

//delete contacts
router.delete('/users/:id', (req, res, next)=> {
    User.deleteOne({_id: req.params.id}, function(err, result){
        if(err){
            res.status(200).json(err);
        } else{
            res.status(200).json(result);
        }
    });
});

module.exports = router;
