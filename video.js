var config = require('./mongoConfig');
var mongoose = config.mongoose;
var db = config.connect();

var User = require('./user.js');
var Schema = mongoose.Schema;

var Video = new Schema({
	id: String,
	title: String,
	publishedAt: Date,
	description: String,
	category: String,
	owner: Schema.Types.ObjectId
});

module.exports = db.model('Video', Video);