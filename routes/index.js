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

exports.upload = function (req, res) {
    //get the file name
  var filename=req.files.file.name;
  var extensionAllowed=[".mov",".doc"];
  var maxSizeOfFile=100;
  var msg="";
  var i = filename.lastIndexOf('.');

  // get the temporary location of the file
      var tmp_path = req.files.file.path;
      
  // set where the file should actually exists - in this case it is in the "images" directory
      var target_path = __dirname +'/upload/' + req.files.file.name;

      var file_extension= (i < 0) ? '' : filename.substr(i);
  if((file_extension in oc(extensionAllowed))&&((req.files.file.size /1024 )< maxSizeOfFile)){
  fs.rename(tmp_path, target_path, function(err) {
          if (err) throw err;
          // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
  fs.unlink(tmp_path, function() {
  if (err) throw err;
  });
  });
  msg="File uploaded sucessfully"
  }else{
  // delete the temporary file, so that the explicitly set temporary upload dir does not get filled with unwanted files
  fs.unlink(tmp_path, function(err) {
              if (err) throw err;
          });
  msg="File upload failed.File extension not allowed and size must be less than "+maxSizeOfFile;
  }
  res.end(msg); 
};

function oc(a){
  var o = {};
  for(var i=0;i<a.length;i++) {
    o[a[i]]='';
  }
  return o;
};