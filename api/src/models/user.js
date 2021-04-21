const mongoose = require('mongoose');

const UserSchema = mongoose.Schema({
    spotify:{
        havespotify:{
            type: Boolean,
            required: true
        },
        spotifytoken:{
            type: String,
            required: false
        }
    }
});

//check if user have a spotify account login
UserSchema.virtual('havespotify')
.get(function(){
    return this.spotify.havespotify;
})
.set(function(b){
    this.spotify.havespotify = b;
});

//check what the username is
UserSchema.virtual('refreshtoken')
.get(function(){
    if(this.havespotify){
        return this.spotify.spotifytoken;
    }else{
        return 'NADA';
    }
})
.set(function(str){
    this.spotify.spotifytoken = str;
});

const User = module.exports = mongoose.model('User', UserSchema);