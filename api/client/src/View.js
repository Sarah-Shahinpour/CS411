import './App.css';
import React from 'react';

/* everything that is rendered onto the screen is below */
class View extends React.Component {
    render() {
        switch (this.props.type){
            case 'Albums':
                return (
                    <div className="loginpage">
                        <h1 className="displaytitle">Albums</h1>
                      {this.props.arr.map(item => (
                          <>
                          <a className="albumtxt" href={item[1]}>{item[0]}</a>
                          <br/>
                        <div><img src={item[2]} alt=""></img></div>
                        <br/>
                        <br/>
                        </>
                      ))}
                    </div>
                  );
            case 'Categories':
                return(
                    <>
                    <div className="loginpage">
                        <h1 className="displaytitle">Categories</h1>
                      {this.props.arr.map(item => (
                        <>
                        <h1 className="albumtxt">{item[0]}</h1>
                        <div><img src={item[2]} alt=""></img></div>
                        <br/>
                        <br/>
                        </>
                      ))}
                    </div>
                    </>
                );
            case 'Genre':
                return(
                    <div className="loginpage">
                        <h1 className="displaytitle">Genres</h1>
                        {this.props.arr.map(item => (
                        <>
                        <h1 className="albumtxt">{item}</h1>
                      </>
                    ))}
                    </div>
                    
                );
            case 'Playlists':
                return(
                    <div className="loginpage">
                        {this.props.arr}
                    </div>
                );
            default:
                return(<>
                </>);
        }
    }
}

export default View;