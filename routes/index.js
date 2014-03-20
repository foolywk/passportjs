var path = require("path");
var googleapis = require('googleapis');
var fs = require('fs');
var User = require('../user.js');
var auth;

// fs.readFileSync(__dirname + '../public/test.MOV')
googleapis.discover('youtube','v3').execute(function(err,client) {

  var metadata= {
    snippet: {title:'title', description: 'description'},
    status: {privacyStatus: 'privacy' }
  };

  User.findOne({ oauthID: 12345, name: "testy" }, function(err, user) {
      user.name.should.eql('testy');
      user.oauthID.should.eql(12345)
      console.log("Client oauthID set to: ", user.oauthID);
      auth = user.oauthID;
      done();
    });

  client
    .youtube.videos.insert({ part: 'snippet,status'}, metadata)
    .withMedia('video/MOV', fs.readFileSync(__dirname + '/test.MOV'))
    .withAuthClient(auth)
    .execute(function(err, result) {
        if (err) console.log(err);
        else console.log(JSON.stringify(result, null, '  '));
    });
});


exports.index = function(req, res){
  res.render('index', { title: "Start Bootstrap"});
};

exports.ping = function(req, res){
  res.send("pong!", 200);
};

exports.uploadVideo = function(req, res) {
  res.send("Hi. This is the page where users can upload video.", 200);

};
