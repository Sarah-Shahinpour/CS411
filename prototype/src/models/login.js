const mongoose = require('mongoose');
const User = require('./users');

const LoginSchema = mongoose.Schema({
    username:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    email:{
        type: String,
        required: true
    },
    rsalt:{
        type: String,
        required: true
    },
    key : {
        type: String,
        required: true
    }
});

const Login = module.exports = mongoose.model('Login', LoginSchema);
