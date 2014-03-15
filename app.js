// dependencies
var fs = require('fs');
var http = require('http');
var express = require('express');
var routes = require('./routes');
var path = require('path');
var app = express();
var config = require('./oauth.js')
var User = require('./user.js')
var mongoose = require('mongoose');
var passport = require('passport');
var fbAuth = require('./authentication.js')
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var vimeo = require('n-vimeo').vimeo;
var request = require('request');

var filePath = path.join(__dirname, '../public/Nosaj_Thing.MOV')

// connect to the database
mongoose.connect('mongodb://localhost/passport-example');

var app = express();

app.configure(function() {
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.logger());
app.use(express.cookieParser());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.session({ secret: 'my_precious' }));
app.use(passport.initialize());
app.use(passport.session());
app.use(app.router);
app.use(express.static(__dirname + '/public'));
});

// serialize and deserialize
passport.serializeUser(function(user, done) {
console.log('serializeUser: ' + user._id)
done(null, user._id);
});

passport.deserializeUser(function(id, done) {
 User.findById(id, function(err, user){
     console.log(user)
     if(!err) done(null, user);
     else done(err, null)
 })
});

// routes
app.get('/', routes.index);
app.get('/ping', routes.ping);
app.get('/uploadVideo', routes.uploadVideo);
app.get('/account', ensureAuthenticated, function(req, res){
User.findById(req.session.passport.user, function(err, user) {
 if(err) {
   console.log(err);
 } else {
   res.render('account', { user: user});
 };
});
});

app.get('/', function(req, res){
res.render('login', { user: req.user });
});

// fb 
app.get('/auth/facebook',
passport.authenticate('facebook'),
function(req, res){
});
app.get('/auth/facebook/callback',
passport.authenticate('facebook', { failureRedirect: '/' }),
function(req, res) {
 res.redirect('/account');
});

// port
app.listen(1337);
console.log('Listening on port 1337');

// test authentication
function ensureAuthenticated(req, res, next) {
if (req.isAuthenticated()) { return next(); }
res.redirect('/')
}
