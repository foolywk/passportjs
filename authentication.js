var express = require('express');
var app = express();
var passport = require('passport')
var FacebookStrategy = require('passport-facebook').Strategy;
var GoogleStrategy = require('passport-google').Strategy;
var User = require('./user.js')
var config = require('./oauth.js')

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

passport.use(new FacebookStrategy({
 clientID: config.facebook.clientID,
 clientSecret: config.facebook.clientSecret,
 callbackURL: config.facebook.callbackURL
},

function(accessToken, refreshToken, profile, done) {
  User.findOne({ oauthID: profile.id }, function(err, user) {
   if(err) { console.log(err); }
   if (!err && user != null) {
     done(null, user);
   } else {
     var user = new User({
       oauthID: profile.id,
       name: profile.displayName,
       email: profile.emails[0].value, 
       created: Date.now()
     });
     user.save(function(err) {
       if(err) {
         console.log(err);
       } else {
         console.log("saving user ...");
         done(null, user);
       };
     });
   };
  });
  }
));

passport.use(new GoogleStrategy({
 returnURL: config.google.returnURL,
 realm: config.google.realm
},
function(accessToken, refreshToken, profile, done) {
User.findOne({ oauthID: profile.id }, function(err, user) {
 if(err) { console.log(err); }
 if (!err && user != null) {
   done(null, user);
 } else {
   var user = new User({
     oauthID: profile.id,
     name: profile.displayName,
     created: Date.now(),

   });
   user.save(function(err) {
     if(err) {
       console.log(err);
     } else {
       console.log("saving user ...");
       done(null, user);
     };
   });
 };
});
}
));

module.exports = passport