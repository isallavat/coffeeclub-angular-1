var express = require('express');
var http = require('http');
var fs = require('fs');
var path = require('path');   

var app = express();

// all environments
app.set('port', process.env.PORT || 2000);
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/views'));
app.use(express.static(__dirname + '/config'));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


app.all('*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "origin, x-requested-with, content-type, accept, set-cookie");
	res.header("Access-Control-Allow-Credentials", true);
	res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
	next();
});


app.get('/', function(req, res, next) {
	if(req.query && req.query.getData) {
		res.json(require('./public/data/' + req.query.getData));
	}
  else res.end(fs.readFileSync('./index.html'));
});

app.post('/', function(req, res, next) {
	console.log(req.body);
	res.json({status: 'success'});
});


var server = http.createServer(app);

server.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});