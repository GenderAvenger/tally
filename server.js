var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
  , connect = require('./node_modules/express/node_modules/connect');

// Set up config credentials
require('./config');
var app = express();

app.configure(function () {
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());

    //items beneath here may not be loaded
    app.use(app.router);
    app.use("/", express.static(path.join(__dirname, 'public')));
});

app.get('/', routes.index);
app.get('/report', routes.report);
app.get('/plot', routes.pie);
app.post('/submit', routes.submit);

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
