const config = {
    app: {
      port: 3000
    },
    db: {
      host: 'localhost',
      port: 27017,
      name: 'TEST'
    },
    spotify : {
        SPOTIFY_CLIENTID : *YOUR SPOTIFY CLIENT ID*,
        SPOTIFY_SECRETID : *YOUR SPOTIFY SECRET ID*,
        callback : *YOUR CALLBACK URL*
    },
    crypto : {
        salt : '!@#$%^&&*()QWERTYASDFZXCV'
    }
};

module.exports = config;
