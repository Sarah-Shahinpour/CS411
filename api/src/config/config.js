const config = {
    app: {
      port: 3001
    },
    db: {
      host: 'localhost',
      port: 27017,
      name: 'DEV'
    },
    spotify : {
        SPOTIFY_CLIENTID : 'Ask for the client ID and Secret ID if you want to run this app!',
        SPOTIFY_SECRETID : 'Look above!',
        callback : 'http://localhost:3001/spotifyapi/callback/'
    },
    crypto : {
        salt : ':D:D:D:D:D:D:D',
        admin : 'URNOTADMIN'
    }
};

module.exports = config;
