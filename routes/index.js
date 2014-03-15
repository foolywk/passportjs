var path = require("path");

exports.index = function(req, res){
  res.render('index', { title: "Start Bootstrap"});
};

exports.ping = function(req, res){
  res.send("pong!", 200);
};

exports.uploadVideo = function(req, res) {
  res.send("This is the page where users can upload video", 200);
};
