var mongoose = require('mongoose');
var Video = require('./video.js');

// create a user model
var User = mongoose.model('User', {
	oauthID: Number, 
	name: String, 
	created: Date,
	accessToken: String,
	refreshToken: String,
	videos: []
	major: String,
	year: String
});

module.exports = User;