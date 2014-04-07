var config = require('./mongoConfig');
var mongoose = config.mongoose;
var db = config.connect();

// create a user model
var User = mongoose.model('User', {
	oauthID: Number,
	name: String,
	created: Date,
	accessToken: String,
	refreshToken: String,
	videos: [],
	major: String,
	year: String
});

module.exports = db.model('User', User);