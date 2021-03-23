// import modules 
const express = require('express');
const mongoose = require ('mongoose');
const cors = require('cors');
const path = require('path');

// server using express
var app = express();

// set up our route.js where all api calls to server will be handled
const route = require('./routes/route');
const spotifyapi = require('./routes/spotifyapi');

// connect to mongodb
mongoose.connect('mongodb://localhost:27017/userlist', {useUnifiedTopology: true,useNewUrlParser: true});
console.log(mongoose.connection.readyState);
// check if connected
mongoose.connection.on('connected', ()=> {
   console.log('Connected to database mongodb @ 27017');
});
mongoose.connection.on('errer', (err)=>{
   if(err){
      console.log('Error in database connection:' + err);
   }
});

// set our port
const port = 3000;

// adding middleware
app.use(cors());
app.use(express.json());
app.use('/api', route);
app.use('/spotifyapi', spotifyapi);

// static files
app.use(express.static(path.join(__dirname, 'public')));

// startup our app at http://localhost:3000
app.listen(port, () => console.log(`Server listening on port ${port}!`));
