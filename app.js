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
var googleapis = require('googleapis');
var request = require('request');
var clientSecrets = require('./client_secrets.json');
var authTokens;

var filePath = path.join(__dirname, './public/test.MOV')

// connect to the database
mongoose.connect('mongodb://localhost/passport-example');

app.configure(function () {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    // app.use(express.logger());
    app.use(express.cookieParser());
    app.use(express.json());
    app.use(express.urlencoded());
    app.use(express.methodOverride());
    app.use(express.session({
        secret: 'my_precious'
    }));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(app.router);
    app.use(express.static(__dirname + '/public'));
    app.use(express.bodyParser({
        keepExtensions: true,
        uploadloadDir: __dirname +'/ temp' })); 
});

// routes
app.get('/', routes.index);
app.get('/ping', routes.ping);
// app.post('/upload', routes.upload);
app.get('/account', ensureAuthenticated, function (req, res) {
    User.findById(req.session.passport.user, function (err, user) {
        if (err) {
            console.log(err);
        } else {
            res.render('account', {
                user: user
            });
        };
    });
});

app.get('/', function (req, res) {
    res.render('login', {
        user: req.user
    });
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

var OAuth2 = googleapis.auth.OAuth2;
var oauth2Client = new OAuth2(
    clientSecrets.web.client_id,
    clientSecrets.web.client_secret,
    "http://127.0.0.1:1337/auth/google/callback");

app.get('/auth/google', function (req, res) {
    var url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
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
        console.log('## AuthTokens:', authTokens);
    });

    res.redirect('/');
});

app.post("/upload", function (req, res) {
    //get the file name
    var filename = req.files.file.name;
    var extensionAllowed = [".MOV", ".doc"];
    var maxSizeOfFile = 100;
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
        msg = "File uploaded sucessfully"
    } else {
        // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
        fs.unlink(tmp_path, function (err) {
            if (err) throw err;
        });
        msg = "File upload failed.File extension not allowed and size must be less than " + maxSizeOfFile;
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

    console.log('## uploadVideo called');

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
            .withMedia('video/MOV', fs.readFileSync(req.files.userUpload.path))
            .withAuthClient(oauth2Client).execute(function (err, result) {
                if (err) console.log(err);
                else console.log(JSON.stringify(result, null, ' '));
            });
    });
    console.log('## Upload Successful! User video uploaded at path:', req.files.userUpload.path);
    res.redirect('/');
});

/*
  req.login({}, function(err) {
    if (err) {
      console.log('Error logging in.', err)
      return res.redirect('/');
    }

    req.session.googleAuth = req.query.code;
    res.redirect('/account');
  })
  */


/*
app.get('/auth/google', function(req, res) {
  var url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: 'https://www.googleapis.com/auth/plus.me'
  });

  res.redirect(url);
});

app.get('/auth/google/callback', function(req, res) {
  console.log('Google callback.', {
    query: req.query,
    body: req.body
  })

  console.log('session...', req.user)
  req.login({}, function(err) {
    if (err) {
      console.log('Error logging in.', err)
      return res.redirect('/');
    }

    req.session.googleAuth = req.query.code;
    res.redirect('/account');
  })
})
*/


/*
app.get('/auth/google',
  passport.authenticate('google'),
  function(req, res){
});
app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: '/' }),
  function(req, res) {
       console.log('Google authenticated.', {
         query: req.query,
         body: req.body,
         param: req.param,
         params: req.params
       })
   res.redirect('/account');
});
*/

app.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

// port
app.listen(1337);
console.log('Listening on port 1337');

// test authentication
function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/')
}