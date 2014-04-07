var mongoose = require('mongoose');
var url;

// choose production and development environments, connect to corresponding db
if (process.env.NODE_ENV === 'production') {
    console.log('Connecting to mongo PRODUCTION.')
    url = 'mongodb://ishmaelthedestroyer:Ishmaelssuperlongpassword777!@ds037997.mongolab.com:37997/heroku_app23832724';
} else {
    console.log('Connecting to mongo DEVELOPMENT.');
    url = 'mongodb://localhost/passport-example';
}

module.exports = {
  mongoose: mongoose,
  connect: function () {
    return mongoose.createConnection(url);
  }
}