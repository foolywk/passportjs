var config = require('./mongoConfig');
var mongoose = config.mongoose;
var db = config.connect();

// create a user model
var User = mongoose.model('User', {
	oauthID: Number,
	name: String,
	email: String
	created: Date,
	accessToken: String,
	refreshToken: String,
	videos: []
});

module.exports = db.model('User', User);