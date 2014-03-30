var ids = {
facebook: {
 clientID: '616700801754177',
 clientSecret: 'cbcb065c56234d776bf328a4635b8200',
 callbackURL: 'http://localhost:1337/auth/facebook/callback'
},
twitter: {
 consumerKey: 'get_your_own',
 consumerSecret: 'get_your_own',
 callbackURL: "http://127.0.0.1:1337/auth/twitter/callback"
},
github: {
 clientID: 'get_your_own',
 clientSecret: 'get_your_own',
 callbackURL: "http://127.0.0.1:1337/auth/github/callback"
},
google: {
 returnURL: 'http://127.0.0.1:1337/auth/google/callback',
 realm: 'http://127.0.0.1:1337'
}
}

module.exports = ids
