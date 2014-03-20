var path = require("path");
var googleapis = require('googleapis');
var fs = require('fs');
var User = require('../user.js');
var passport = require('../authentication.js').passport
var clientSecrets = require('../client_secrets.json')

var OAuth2 = googleapis.auth.OAuth2;
var test = new OAuth2("347150572630.apps.googleusercontent.com", "W0hjveoJ7dx4Gw_21fgou9Hw", "http://127.0.0.1:1337/auth/google/callback");

exports.index = function (req, res) {
    res.render('index', {
        title: "Start Bootstrap"
    });
};

exports.ping = function (req, res) {
    res.send("pong!", 200);
};

exports.uploadVideo = function (req, res) {
    console.log('## User object:', req.user);
    console.log('## Client ID:', clientSecrets.web.client_id);
    res.send(200);

    googleapis.discover('youtube', 'v3').execute(function (err, client) {

        var metadata = {
            snippet: {
                title: 'title',
                description: 'description'
            },
            status: {
                privacyStatus: 'privacy'
            }
        };

        if (!req.user) { return res.redirect('/login')}
        else { test.credentials = { access_token: req.user.oauthID }}


        client.youtube.videos.insert({
            part: 'snippet,status'
        }, metadata).withMedia('video/MOV', fs.readFileSync(__dirname + '/test.MOV')).withAuthClient(test).execute(function (err, result) {
            if (err) console.log(err);
            else console.log(JSON.stringify(result, null, ' '));
        });
    });
};