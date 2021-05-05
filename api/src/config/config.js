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
        SPOTIFY_CLIENTID : '',
        SPOTIFY_SECRETID : '',
        callback : 'http://localhost:3001/spotifyapi/callback/'
    },
    crypto : {
        salt : ':D:D:D:D:D:D:D',
        admin : 'URNOTADMIN'
    }
};

module.exports = config;
