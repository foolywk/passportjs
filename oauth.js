var ids = {
	facebook: {
		clientID: '616700801754177',
		clientSecret: 'cbcb065c56234d776bf328a4635b8200',
		callbackURL: 'http://perfect-pitch.herokuapp.com/auth/facebook/callback'
	},

	google: {
		returnURL: 'http://perfect-pitch.herokuapp.com/auth/google/callback',
		realm: 'http://perfect-pitch.herokuapp.com'
	}
}
module.exports = ids