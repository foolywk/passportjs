var mongoose = require('mongoose');
var User = require('./user.js');
var Schema = mongoose.Schema;

var Video = new Schema({ 
	id: String, 
	title: String,
	publishedAt: Date,
	owner: User
});

module.exports = mongoose.model('Video', Video);