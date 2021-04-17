// import modules
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const mongoose = require ('mongoose');

// set up our routes where all api calls to the server will be handled
const indexapi = require('./routes/index');
const mongoapi = require('./routes/mongoapi');
const auth = require('./routes/auth');
const spotifyapi = require('./routes/spotifyapi');

//configs 
const config = require('./config/config');

// start our express server
var app = express();
const { db: { host, port, name } } = config;

// connect to mongodb
var mongoURL = `mongodb://${host}:${port}/${name}`;
mongoose.connect(mongoURL, {useUnifiedTopology: true,useNewUrlParser: true});
// check if connected
mongoose.connection.on('connected', ()=> {
   console.log('Connected to database mongodb @ 27017');
});
mongoose.connection.on('errer', (err)=>{
   if(err){
      console.log('Error in database connection:' + err);
   }
});

// view 
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'pug');

// middleware
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));

// routes
app.use('/', indexapi);
app.use('/api', mongoapi);
app.use('/login', auth);
app.use('/spotifyapi', spotifyapi);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', {message: err.status});
});

//export for bin/www
module.exports = app;
