var path = require("path");
var googleapis = require('googleapis');
var fs = require('fs');
var User = require('../user.js');
var passport = require('../authentication.js').passport
var clientSecrets = require('../client_secrets.json')
var auth;

exports.index = function(req, res){
  res.render('index', { title: "Start Bootstrap"});
};

exports.ping = function(req, res){
  res.send("pong!", 200);
};

exports.uploadVideo = function(req, res) {
  console.log('## User object:', req.user);
  console.log('## Client ID:', clientSecrets.web.client_id);
  res.send(200);

  googleapis.discover('youtube','v3').withAuthClient(clientSecrets.web.client_id).execute(function(err,client) {

    var metadata= {
      snippet: {title:'title', description: 'description'},
      status: {privacyStatus: 'privacy' }
    };

    client
      .youtube.videos.insert({ part: 'snippet,status'}, metadata)
      .withMedia('video/MOV', fs.readFileSync(__dirname + '/test.MOV'))
//      .withAuthClient(req.user.oauthID)
      .execute(function(err, result) {
          if (err) console.log(err);
          else console.log(JSON.stringify(result, null, '  '));
      });
  });
};
