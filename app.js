// dependencies
var fs = require('fs');
var http = require('http');
var express = require('express');
var routes = require('./routes');
var path = require('path');
var app = express();
var config = require('./oauth.js');
var User = require('./user.js');
var Video = require('./video.js');
var mongoose = require('mongoose');
var passport = require('passport');
var fbAuth = require('./authentication.js')
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var googleapis = require('googleapis');
var request = require('request');
var clientSecrets = require('./client_secrets.json');
var OAuth2 = googleapis.auth.OAuth2;
// var youtube = require('youtube-video');
var oauth2Client = new OAuth2(
    clientSecrets.web.client_id,
    clientSecrets.web.client_secret,
    "http://127.0.0.1:1337/auth/google/callback");
var access_token; 
var refresh_token;

// connect to the database
mongoose.connect('mongodb://localhost/passport-example');

// set access and refresh token from database (stored in admin's account)
User.findOne({ oauthID: '706352243' }, function(err, user) {
 if(err) { console.log(err); }
 if (!err && user != null) {
   access_token = user.accessToken;
   refresh_token = user.refreshToken;
   console.log("## Access token set to " + access_token + "\n" + "## Refresh token set to " + refresh_token);
 }
});

app.configure(function () {
    app.set('port', process.env.PORT || 1337);
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    // app.use(express.logger());
    /* app.use(express.bodyParser({
        keepExtensions: true, 
        uploadloadDir: __dirname +'/temp' })); */
    app.use(express.multipart());
    app.use(express.cookieParser());
    // app.use(express.json());
    app.use(express.urlencoded()); 
    app.use(express.methodOverride());
    app.use(express.session({
        secret: 'my_precious'
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
});

// routes
app.get('/', function (req, res) {
    res.render('index', {
        user: req.user
    });
});
app.get('/account', ensureAuthenticated, function (req, res) {
    User.findById(req.session.passport.user, function (err, user) {
        if (err) {
            console.log(err);
        } else {
            res.render('login', {
                user: user
            });
        };
    });
});
app.get('/login', function (req, res) {
    res.render('login', {
        user: req.user
    });
});
app.get('/logout', function (req, res) {
    var username = JSON.stringify(req.user.name)
    req.logout();
    console.log("## User " + username + " has been logged out.");
    res.redirect('/');
});

// fb
app.get('/auth/facebook',
    passport.authenticate('facebook'),
    function (req, res) {});

app.get('/auth/facebook/callback',
    passport.authenticate('facebook', {
        failureRedirect: '/'
    }),
    function (req, res) {
        res.redirect('/account');
    });

// google
app.get('/auth/google', function (req, res) {
    var url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        approval_prompt: 'force',
        scope: 'https://www.googleapis.com/auth/youtube.upload'
    });

    res.redirect(url);
});

app.get('/auth/google/callback', function (req, res) {
    console.log('Google callback.', {
        query: req.query,
        body: req.body
    })

    console.log('session...', req.session)

    oauth2Client.getToken(req.query.code || '', function (err, tokens) {
        console.log('ACCESS TOKENS......', {
            err: err,
            tokens: tokens
        });
        authTokens = tokens;

        User.findOne({ oauthID: '706352243' }, function(err, user) {
         if(err) { console.log(err); }
         if (!err && user != null) {

           user.accessToken = authTokens.access_token;
           user.refreshToken = authTokens.refresh_token;

           user.save(function(err) {
             if(err) {
               console.log(err);
             } else {
               console.log("saving access, refresh token to user ...");
             };
         });
         };
        });
    });
    res.redirect('/');
});

app.post("/upload", function (req, res) {

    //get the file name
    console.log("## /upload called for file: " + JSON.stringify(req.files, undefined, 2) 
        + "\n## Title: " + req.body.title 
        + "\n## Description: " + req.body.description);
    var filename = req.files.file.name;
    var extensionAllowed = [".MOV", ".MPEG4", ".AVI", ".WMV"];
    var maxSizeOfFile = 10000;
    var msg = "";
    var i = filename.lastIndexOf('.');

    // get the temporary location of the file
    var tmp_path = req.files.file.path;

    // set where the file should actually exists - in this case it is in the "images" directory
    var target_path = __dirname + '/upload/' + req.files.file.name;

    var file_extension = (i < 0) ? '' : filename.substr(i);

    if ((file_extension in oc(extensionAllowed)) && ((req.files.file.size / 1024) < maxSizeOfFile)) {
        fs.rename(tmp_path, target_path, function (err) {
            if (err) throw err;
            // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
            fs.unlink(tmp_path, function () {
                if (err) throw err;
            });
        });
        // handle upload to youtube 
        googleapis.discover('youtube', 'v3').execute(function (err, client) {
        var metadata = {
            snippet: {
                title: req.body.title,
                description: req.body.description
            },
            status: {
                privacyStatus: 'private'
            }
        };
        // pass auth, refresh tokens
        oauth2Client.credentials = {
          access_token: access_token,
          refresh_token: refresh_token
        } 

        client.youtube.videos.insert({
            part: 'snippet, status'
        }, metadata)
            .withMedia('video/MOV', fs.readFileSync(target_path))
            .withAuthClient(oauth2Client).execute(function (err, result) {
                if (err) console.log(err);
                else console.log(JSON.stringify(result, null, ' '));

                // save uploaded video to db
                 var video = new Video({
                   id: result.id,
                   title: result.snippet.title,
                   description: result.snippet.description,
                   publishedAt: result.snippet.publishedAt,
                   owner: req.user
                 });
                 video.save(function(err) {
                   if(err) {
                     console.log(err);
                   } else {
                     console.log("saved new video: ", JSON.stringify(video, null, "\t"));
                     // done(null, video);
                   };
                 }); 
                
                // save upload video to its owner, update year & major     
                User.findOne({ oauthID: req.user.oauthID}, function(err, user) {
                 if(err) { console.log(err); }
                 if (!err && user != null) {

                   user.videos.push(video); 
                   // user.major = req.body.major;
                   // user.year = req.body.year; 

                   user.save(function(err) {
                     if(err) {
                       console.log(err);
                     } else {
                       console.log("saving uploaded video to user...");
                     };
                 });
                 };
                });               
            });
        });
        msg = "File " + JSON.stringify(req.files.file.name) + " successfully uploaded to youtube!"
    } else {
        // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
        fs.unlink(tmp_path, function (err) {
            if (err) throw err;
        });
        msg = "File upload failed. File extension not allowed and size must be less than " + maxSizeOfFile;
    }
    res.end(msg);
});

function oc(a) {
    var o = {};
    for (var i = 0; i < a.length; i++) {
        o[a[i]] = '';
    }
    return o;
}

app.get('/uploadVideo', function (req, res) {

    console.log('## uploadVideo called for ' + JSON.stringify(req.file.files));

    googleapis.discover('youtube', 'v3').execute(function (err, client) {

        var metadata = {
            snippet: {
                title: 'Perfect Pitch Test Upload',
                description: 'Test Description'
            },
            status: {
                privacyStatus: 'private'
            }
        };

        console.log('## AuthTokens:', authTokens);
        oauth2Client.credentials = {
            access_token: authTokens.access_token
        }

        client.youtube.videos.insert({
            part: 'snippet,status'
        }, metadata)
            .withMedia('video/MOV', fs.readFileSync(req.files.file.path))
            .withAuthClient(oauth2Client).execute(function (err, result) {
                if (err) console.log(err);
                else console.log(JSON.stringify(result, null, ' '));
            });
    });
    res.redirect('/');
});

// port
http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

// test authentication
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/')
}