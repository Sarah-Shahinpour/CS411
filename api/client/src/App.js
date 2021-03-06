import './App.css';
import React, {Component} from 'react';
import View from './View';
import Cookies from 'universal-cookie';

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
        displayArray : [],
        type : 'none',
        artists: [], 
        genre: "", 
        track: "", 
        artistId: "", 
        trackId: "",
        playlistID: "",
        session : 'none',
        username : '',
        password : '',
        email : '',
        link : 'http://localhost:3001/spotifyapi/login',
        makeAcc : false,
        loggedIn : false,
        loginSpotify : false
    };   
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.search = this.search.bind(this);
    this.searchArtist = this.searchArtist.bind(this);
    this.searchTrack = this.searchTrack.bind(this);
    this.createPlaylist = this.createPlaylist.bind(this);
    this.getSpotifyNewReleases = this.getSpotifyNewReleases.bind(this);
    this.getSpotifyCategories = this.getSpotifyCategories.bind(this);
    this.getSpotifyGenre = this.getSpotifyGenre.bind(this);
    this.getSpotifyFeaturedPlaylist = this.getSpotifyFeaturedPlaylist.bind(this);
    this.loginSubmit = this.loginSubmit.bind(this);
    this.loginPanel = this.loginPanel.bind(this);
    this.AccSubmit = this.AccSubmit.bind(this);
    this.toggleAccount = this.toggleAccount.bind(this);
  }

  handleChange({target}) {
    this.setState({
        [target.name]: target.value
    });
  }

  handleSubmit(event) {
    event.preventDefault();
    this.search();
  }

  searchArtist() {
    let data = {type: 'artist', q: this.state.artist}
    fetch('/spotifyapi/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    .then(res => res.text())
    .then(res => {
      if (res === "error") {
        alert("Cannot find your favorite artist! Try Again!");
        return
      }
      this.setState({artistId: res});
    });
  }

  searchTrack() {
    let data = {type: 'track', q: this.state.track}
    fetch('http://localhost:3001/spotifyapi/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
    .then(res => res.text())
    .then(res => {
      if (res === "error") {
        alert("Cannot find your favorite track! Try Again!");
        return
      }
      this.setState({trackId: res});
    });
  }

  search() {
    this.searchArtist();
    this.searchTrack();
  }
  
  getSpotifyNewReleases(){
    let ip = '/spotifyapi/nr';
    var arrAlbums = [];

    fetch(ip, {
        method: 'GET',
    })
    .then(res => res.json())
    .then(result => {
        let length = result.albums.limit;

        for(var i = 0; i < length; i++){
            arrAlbums.push([result.albums.items[i].name, result.albums.items[i].external_urls.spotify, result.albums.items[i].images[0].url]);
        }
        this.setState({ 
            displayArray : arrAlbums,
            type : 'Albums'
        });
        }
    );
}
getSpotifyCategories(){
    let ip = '/spotifyapi/categories';
    fetch(ip, {
        method: 'GET',
    })
    .then(res => res.json())
    .then(result => {
        let result_json = JSON.parse(result);
        let categories = [];
        let length = result_json.categories.limit;
        for(var i = 0; i < length; i++){
            categories.push([result_json.categories.items[i].name, result_json.categories.items[i].href,
                result_json.categories.items[i].icons[0].url]);
        }
        
        this.setState({ 
            displayArray : categories,
            type : 'Categories'
        });
        }
    );
}
getSpotifyGenre(){
    let ip = '/spotifyapi/genre';
    fetch(ip, {
        method: 'GET',
    })
    .then(res => res.json())
    .then(result => {
        let result_json = JSON.parse(result);
        let genres = [];
        let length = result_json.genres.length;
        for(var i = 0; i < length; i++){
            genres.push([result_json.genres[i]]);
        }
        
        this.setState({ 
            displayArray : genres,
            type : 'Genre'
        });
        }
    );
}

getSpotifyFeaturedPlaylist(){
    let ip = '/spotifyapi/featuredplaylist';
    fetch(ip, {
        method: 'GET',
    })
    .then(res => res.json())
    .then(result => {
        let result_json = JSON.parse(result);
        let playlist = [];
        for(var i = 0; i < 20; i++){
            playlist.push([result_json.playlists.items[0].name, result_json.playlists.items[0].id, ]);
        }
        
        this.setState({ 
            displayArray : playlist,
            type : 'Playlists'
        });
    }   
    );
}

  createPlaylist() {
    var arrIds = [];
    var arrNames = [];
    var arrPreview = [];
    let uris_str = "";
    let pid = "";
    const cookies = new Cookies();
    cookies.set('sessionId', this.state.session);

    if (this.state.artistId === "" || this.state.trackId === "" || this.state.genre === "") {
      alert("You need to tell us your favorites and save them first!");
      return
    }

    fetch('/spotifyapi/recommendation/?artists='+ this.state.artistId.replace(/['"]+/g, '') +'&genre=' + this.state.genre.replace(/['"]+/g, '') + '&tracks=' + this.state.trackId.replace(/['"]+/g, ''), {
        method: 'GET',
    })
    .then(res => res.json())
    .then(res => {
        let body = JSON.parse(res);
        for(var i = 0; i < 20; i++){
          arrIds[i] = body['tracks'][i]['id'];
          arrNames[i] = body['tracks'][i]['name'];
          arrPreview[i] = body['tracks'][i]['preview_url'];
        }

        fetch('/spotifyapi/newplaylist', {
          method: 'GET',
        })
        .then(res => res.text())
        .then(res => {
          pid = res

          for(var i = 0; i < 20; i++) {
            uris_str = uris_str + 'spotify:track:' + arrIds[i] + ',';
          }
          
          const data = {playlistID: pid, uris: uris_str}
            
          fetch('/spotifyapi/additems', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          })
          .then(res => res.text());
        });
      }
    );

    alert("Check your spotify!")
  }

  componentDidMount() {
    let a_token = window.location.search;
    if (a_token) {
        if (a_token.slice(0, 11) === "?sessionId=") {
            this.setState({
                session: a_token.slice(11),
                loginSpotify : true, 
                loggedIn : false,
            });
            window.history.pushState({}, null, "/");
        }else if (a_token.slice(0, 14) === "?loginSession=") {
            this.setState({session: a_token.slice(14), 
                loggedIn : true, 
                link : 'http://localhost:3001/spotifyapi/loginWithAcc/'+a_token.slice(14),
                loginSpotify : true,
            });
            window.history.pushState({}, null, "/");
        }
    }
  }

  loginSubmit(event){
    event.preventDefault();
    const {username, password} = this.state;
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    var data = JSON.stringify({
        "username": username,
        "password": password
      });
      
      var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: data,
        redirect: 'follow'
      };
      
      fetch("/login/userlogin", requestOptions)
      .then(response => response.json())
      .then(result =>{
          if(result.sessionId!=null){
            this.setState({
                session : result.sessionId,
                loggedIn : true,
                loginSpotify : false,
                link : 'http://localhost:3001/spotifyapi/loginWithAcc/'+result.sessionId
            });
          }
          else {
            alert("Username and Password don't match!");
          }
      });
  }

  AccSubmit(event){
    event.preventDefault();
    const {username, password, email} = this.state;
    var myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    var data = JSON.stringify({
        "username": username,
        "password": password,
        "email": email
      });
      
      var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: data,
        redirect: 'follow'
      };
      
      fetch("/login/user", requestOptions)
      .then(response => response.json())
      .then(result =>{
          if(result.sessionId!=null){
            this.setState({
                loggedIn : true,
                session : result.sessionId,
                link : 'http://localhost:3001/spotifyapi/loginWithAcc/'+result.sessionId
            });
          }
          else {
            alert("Username taken!");
          }
      });
  }
  toggleAccount(){
      const {makeAcc} = this.state;
      this.setState({
          makeAcc : !makeAcc
      });
  }
  loginPanel(loggedIn, makeAcc, loginSpotify, link){
      if(!loggedIn){
        if(makeAcc){
            return (
                <div className="loginpage">
                  <div className="App-header">CS 411 Team 11</div>
                  <text className="loginwelcome">Sign up with our app</text>
                  <form className="loginform" onSubmit={this.AccSubmit}>
                      <label>
                        Username:
                        <input type="text" name="username" value={this.state.username} onChange={this.handleChange} />
                      </label><br></br>
                      <label>
                        Password:
                        <input type="text" name="password" value={this.state.password} onChange={this.handleChange} />
                      </label><br></br>
                      <label>
                        Email:
                        <input type="text" name="email" value={this.state.email} onChange={this.handleChange} />
                      </label><br></br>
                      <input id="createbox" type="submit" value="Create Account"/>
                    </form>
                    <br/>
                    <button className="signupbutton" onClick={this.toggleAccount}>Return to Login</button>
                </div>);
          }else{
            return (
                <div className="loginpage">
                  <div className="App-header">CS 411 Team 11</div>
                  <text className="loginwelcome">Log in with your Spotify account and get a new playlist!</text>
                  <br/>
                  <a className="App-link" href={link}>Log In With Spotify</a>

                  <text className="loginwelcome">If you only want song recommendations, sign in here.</text>
                  <form className="loginform" onSubmit={this.loginSubmit}>
                    <label>
                      Username:
                      <input type="text" name="username" value={this.state.username} onChange={this.handleChange} />
                    </label><br></br>
                    <label>
                      Password:
                      <input type="text" name="password" value={this.state.password} onChange={this.handleChange} />
                    </label><br></br>
                    <input className="loginbutton" type="submit" value="Login" />
                  </form>
                  <br></br>
                  <text className="loginwelcome">First time? Sign up here.</text>
                  <br/>
                  <button className="signupbutton" onClick={this.toggleAccount}>Sign Up</button>
                </div>);
          }
      }else{
          if(loginSpotify){
            return (
                <>
                <p>LOL THERE's no logging out :D</p>
                </>);
          }else{
            return (
                <>
                <p>LOL THERE's no logging out :D</p>
                <br></br>
                <a className="App-link" href={link}>Log In To Spotify</a>
                </>);
          }
        
      }
    
  }

  render() {
      const {displayArray, type, session, makeAcc, link, loggedIn, loginSpotify} = this.state;
      const login = this.loginPanel(loggedIn, makeAcc, loginSpotify, link);
      
    if (session === "none") {
      return (
        <div id="login">
          {login}
        </div>
      )
    }
    return (
      <div className="loginpage">
          <div className="App-header">CS 411 Team 11</div>
          <form className="loginform" onSubmit={this.handleSubmit}>
          <label>
              Favorite Artist:
              <input type="text" name="artist" value={this.state.artist} onChange={this.handleChange} />
          </label>
          <br/>
          <label>
              Favorite Genre:
              <input type="text" name="genre" value={this.state.genre} onChange={this.handleChange} />
          </label>
          <br/>
          <label>
              Favorite Track:
              <input type="text" name="track" value={this.state.track} onChange={this.handleChange} />
          </label>
          <br/>
          <input className="savebutton" type="submit" value="Save your answers" />
          </form>
          <br/>
          <div className="mainbody">
            <div className="half">
              <text className="navtext">Browse</text>
              <div className="browse" id="spotifyBrowse">
                  <button className="signupbutton" onClick={this.getSpotifyCategories}>Categories</button>
                  <button className="signupbutton" onClick={this.getSpotifyGenre}>Genres</button>
                  <button className="signupbutton" onClick={this.getSpotifyNewReleases}>New Releases</button>  
              </div>
            </div>
            <div className="half">
              {(this.state.loginSpotify) ? 
                <div className="browse">
                  <button className="playlistbutton" onClick={this.createPlaylist}>Create a Playlist</button>
                </div>
              : 
              <div>
                <br/>
                <a href='http://localhost:3001/spotifyapi/login' className="navtext">Log in with Spotify to make a new playlist!</a>
              </div>
              }
            </div>
          </div>
          <div id="display">
            <View arr={displayArray} type={type}></View>
          </div>
      </div>
    );
  }
}

export default App;
