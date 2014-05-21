var argv = require('optimist').argv;

// choose production and development environments, connect to corresponding db
if ((argv.environment != null) && argv.environment === 'production') {
  process.env.NODE_ENV = 'production';
} else {
  process.env.NODE_ENV = 'development';
}

var mongoose = require('mongoose');

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
var passport = require('passport');
var fbAuth = require('./authentication.js')
var LocalStrategy = require('passport-local').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var googleapis = require('googleapis');
var request = require('request');
var clientSecrets = require('./client_secrets.json');
var OAuth2 = googleapis.auth.OAuth2;
var nodemailer = require("nodemailer");
var oauth2Client = new OAuth2(
    clientSecrets.web.client_id,
    clientSecrets.web.client_secret,
    // "http://127.0.0.1:1337/auth/google/callback"
    "http://perfect-pitch.herokuapp.com/auth/google/callback");
var mcapi = require('mailchimp-api');
var mc = new mcapi.Mailchimp(clientSecrets.web.mcapiKey);
var list_id = clientSecrets.web.mcListId;
var argv = require('optimist').argv;
var access_token;
var refresh_token;
var transport = nodemailer.createTransport("SMTP", {
    service : "Gmail",
    auth: {
        user: "brandon@perfectpitch.io",
        pass: clientSecrets.web.gmailPass
    }
});

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
    
        
    Video.find({}, function (err, videos) {
        if (err) {
            console.log(err);
        } else {
            console.log("\n## VIDEOS: " + videos);
            
            res.render('index', {
                user: req.user,
                videos: videos 
            });
        }
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


app.get('/signup', function (req, res) {
    res.render('success');
});

app.get('/faq' , function (req, res) {
    res.render('faq');
});

// Email Registration
app.post('/signup', function (req, res) {

    // mailchimp subscribe
      if (req.body && req.body.EMAIL) {
      mc.lists.subscribe({id: list_id, email:{email:req.body.EMAIL}}, function(data) {
          // res.contentType('json');
          // res.send({response:'success'});
        },
        function(error) {
          // res.contentType('json');
          // res.send({response:error.error});
      });
  } else {
    res.send({response:'could not find email'});
  }
    /* nodemailer
    var mailOptions = {
        // from: "takkun00@gmail.com", 
        to: "contact@perfectpitch.io, " + req.body.EMAIL, // list of receivers
        subject: "Submission Instructions for Perfect Pitch 2014!", // Subject line
        generateTextFromHTML: true,
        html: "<h1>Welcome! | Perfect Pitch 2014</h1><h3> Thanks for registering for Perfect Pitch, UCLA's biggest Pitch Comptetition! Below are instructions on how to submit your 1-2 online video pitch through Vimeo. <br> Please also read our <a href='http://perfectpitch.io/faq'>FAQ page</a> for guidelines on what makes a good pitch! <br> <ol><li>If you don't have one already, <a href='https://vimeo.com/log_in'>sign up for a Vimeo account</a> (or login with Facebook).</li><br><li>Join the Perfect Pitch 2014 Vimeo group by going to <a href='http://vimeo.com/groups/PerfectPitch'>www.vimeo.com/groups/perfectpitch</a> and clicking 'Join this group'.<br><br><img src='https://raw.githubusercontent.com/foolywk/perfect-pitch/master/public/images/joinvimeogroup.png'; style='width:500px'></img></li> <br><br> <li>Upload your video by cliking the 'Upload' link above and choosing the video file for your pitch. You should enter your name and a brief description of your pitch with your upload. <br><br> <img src='https://raw.githubusercontent.com/foolywk/perfect-pitch/master/public/images/uploadvimeo.png'; style='width:500px'></img></li> <br> <li>Click on 'Add To' and select the Perfect Pitch 2014 group. <br><br> <img src='https://raw.githubusercontent.com/foolywk/perfect-pitch/master/public/images/addtogroup.png'; style='width:500px'></img> <br><br> <img src='https://raw.githubusercontent.com/foolywk/perfect-pitch/master/public/images/selectgroup.png'; style='width:500px'></img> </li></ol></h3> <h3>Thats it! Once you've uploaded your video pitch and added it to the Perfect Pitch group, we'll review it and let you know once we've made our selections for finalists! Please feel free to email us at <a href='mailto:contact@perfectpitch.io'>contact@perfectpitch.io</a> with any questions about the contest or submission process. <br><br> Thanks for participating, and good luck!.</h3> <p><b>Perfect Pitch 2014</b> presented by <a href=http://bruinentrepreneurs.org'>Bruin Entrepreneurs</a> <br> <a href='http://facebook.com/perfectpitchla'>Facebook</a> | <a href='http://twitter.com/perfectpitchla'>Twitter</a> </p> "
    }
    transport.sendMail(mailOptions, function(error, response){
        if(error){
            console.log(error);
        }else{
            console.log("Message sent: " + response.message);
        }
        transport.close(); // shut down the connection pool, no more messages
    }); 
    */
   res.render('success'); 
});

// fb
app.get('/auth/facebook',
    passport.authenticate('facebook', {scope: ['email', 'publish_stream']}),
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



/*
app.post("/upload", function (req, res) {

    //get the file name
    console.log("## /upload called for file: " + JSON.stringify(req.files, undefined, 2)
        + "\n## Title: " + req.body.title
        + "\n## Description: " + req.body.description
        + "\n## Category " + req.body.category);
    var filename = req.files.file.name;
    var extensionAllowed = [".MOV", ".MP4", ".AVI", ".WMV"];
    var maxSizeOfFile = 100000;
    var msg = "";
    var i = filename.lastIndexOf('.');

    // get the temporary location of the file
    var tmp_path = req.files.file.path;

    // set where the file should actually exists - in this case it is in the "images" directory
    var target_path = __dirname + '/upload/' + req.files.file.name;

    var file_extension = (i < 0) ? '' : filename.substr(i).toUpperCase();

    if ((file_extension in oc(extensionAllowed)) && ((req.files.file.size / 1024) < maxSizeOfFile)) {

        // handle upload to youtube
        googleapis.discover('youtube', 'v3').execute(function (err, client) {
        var metadata = {
            snippet: {
                title: req.body.title,
                description: req.body.description
            },
            status: {
                privacyStatus: 'public'
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
            .withMedia('video/MOV', fs.readFileSync(tmp_path))
            .withAuthClient(oauth2Client).execute(function (err, result) {
                if (err) console.log(err);
                else console.log(JSON.stringify(result, null, ' '));

                // save uploaded video to db
                 var video = new Video({
                   id: result.id,
                   title: result.snippet.title,
                   description: result.snippet.description,
                   category: req.body.category,
                   publishedAt: result.snippet.publishedAt,
                   owner: req.user._id
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
                       return res.render('failure', {
                        user: req.user
                       });
                    }
                    console.log("Saving video to user...");
                   });
                 };
                });
            });
        });
        // msg = "File " + JSON.stringify(req.files.file.name) + " successfully uploaded to youtube!"
        res.render('success', {
            user: req.user
        });
    } else {
        // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
        fs.unlink(tmp_path, function (err) {
            if (err) throw err;
        });
        // msg = "File upload failed. File extension not allowed and size must be less than " + maxSizeOfFile;
        res.render('failure', {
            user: req.user
        });
    }
});
*/
function oc(a) {
    var o = {};
    for (var i = 0; i < a.length; i++) {
        o[a[i]] = '';
    }
    return o;
}

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




