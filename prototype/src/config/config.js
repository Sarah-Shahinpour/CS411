const config = {
    app: {
      port: 3000
    },
    db: {
      host: 'localhost',
      port: 27017,
      name: 'userlist'
    },
    spotify : {
        SPOTIFY_CLIENTID : *YOUR SPOTIFY CLIENT ID*,
        SPOTIFY_SECRETID : *YOUR SPOTIFY SECRET ID*,
        callback : *CALL BACK URL*
    }
};

module.exports = config;
