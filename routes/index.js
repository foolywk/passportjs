var path = require("path");
var ytUploader = require('youtube-uploader');
var fs = require('fs');
var file = __dirname + client_secrets.json
var json 

var filePath = path.join(__dirname, './public/test.MOV')

exports.index = function(req, res){
  res.render('index', { title: "Start Bootstrap"});
};

exports.ping = function(req, res){
  res.send("pong!", 200);
};


fs.readFile(file, 'utf8', function (err, data) {
  if (err) {
    console.log('Error: ' + err);
    return;
  }
  json = JSON.parse(data);
});


exports.uploadVideo = function(req, res) {
  res.write("This is the page where users can upload video", 200);

  youtubeUploader.configure({
  accessToken: ACCESS_TOKEN,  // string
  clientId: json.client_id,  // string
  clientSecret: json.client_secret,  // string
  expiresIn: '3600',  // string (default: '3600')
  idToken: ID_TOKEN,  // string
  refreshToken: REFRESH_TOKEN,  // string
  tokenType: 'Bearer'  // string (default: 'Bearer')
}, function (err) {
  if (err) { return console.error(err.message); }
  youtubeUploader.upload({
    path: filePath,  // string
    title: 'PP Test Upload',  // string
    description: 'Lorem Ipsum Description',  // string
    keywords: 'KEYWORDS',  // array of string
    category: '22',  // string (refer to https://developers.google.com/youtube/v3/docs/videoCategories/list)
    privacy: 'unlisted'  // 'public', 'private', or 'unlisted'
  }, function (err, videoId) {
    // ...
  });
});


};
