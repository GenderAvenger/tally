var express = require('express')
  , http = require('http')
  , path = require('path')
  , nunjucks = require('nunjucks')
  , Firebase = require('firebase');

// Express 3.x to 4.x Migration
var bodyParser = require('body-parser')
  , cookieParser = require('cookie-parser')
  , cookieSession = require('cookie-session')
  , morgan = require('morgan') // replaced express.logger
  , favicon = require('serve-favicon');

// Set up config credentials
require('./config');
var app = express();
module.exports.app = app;

nunjucks.configure(__dirname + '/views', {
    autoescape: true,
    express: app
});

// Set global template variables
var njglobals = require('nunjucks/src/globals');
njglobals.recaptcha_public_key = process.env['RECAPTCHA_PUBLIC_KEY'];
app.set('views', __dirname + '/views');

// Connect to firebase
var firebaseDatastore = new Firebase(process.env['FIREBASE_STORE'])
firebaseDatastore.auth(process.env['FIREBASE_SECRET'], function(error) {
  if(error) {
    console.log("Login Failed!", error);
  } else {
    console.log("Login Succeeded!");
  }
});
module.exports.firebaseDatastore = firebaseDatastore;

// Set up the flavicon
app.use(favicon(__dirname + "/public/favicon.ico"));
// Set up body parsing for POST data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Set up what we need for cookie sessions (used to avoid re-showing)
app.use(cookieParser('equalityrules'));
app.use(cookieSession({
  keys: ['equalityrules']
}));

// Load static files from /public
app.use(express.static(__dirname + '/public'));
// Set up logging middleware (after static so we don't log static file requests)
app.use(morgan('dev'));

// Prepare the routes
require('./routes')

app.set('port', process.env.PORT || 3000);
app.listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
