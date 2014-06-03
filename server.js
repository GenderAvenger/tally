var express = require('express')
  , http = require('http')
  , path = require('path')
  , nunjucks = require('nunjucks')
  , connect = require('./node_modules/express/node_modules/connect')
  , Firebase = require('firebase');

// Set up config credentials
require('./config');
var app = express();
module.exports = app;

nunjucks.configure(__dirname + '/views', {
    autoescape: true,
    express: app
});

// Set global template variables
var njglobals = require('nunjucks/src/globals');
// You need to set this value yourself in a file called 'creds.yaml' in the root folder
// The form of that file is
/*
  imgurApiKey: "YOUR_IMGUR_KEY"
  recaptchaPublicKey: "YOUR_PUBLIC_KEY"
  recaptchaPrivateKey: "YOUR_PRIVATE_KEY"
  firebaseSecret: "FIREBASE_SECRET"
*/
njglobals.recaptcha_public_key = process.env['RECAPTCHA_PUBLIC_KEY'];

var firebaseDatastore = new Firebase(process.env['FIREBASE_STORE'])
firebaseDatastore.auth(process.env['FIREBASE_SECRET'], function(error) {
  if(error) {
    console.log("Login Failed!", error);
  } else {
    console.log("Login Succeeded!");
  }
});

app.configure(function () {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');

    app.use(express.favicon(__dirname + "/public/favicon.ico"));
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser('equalityrules'));
    app.use(express.cookieSession());

    // Load static files from /public
    app.use(express.static(__dirname + '/public'));

    // Prepare the routes
    require('./routes')

    //items beneath here may not be loaded
    app.use(app.router);
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
