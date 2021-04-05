'use strict';

///////////////////////////////////////////////////start
//1st step (DOTENV) read our environment variable:
require( 'dotenv' ).config();
///////////////////////////////////////////////////end


///////////////////////////////////////////////////start
//2nd step (instal express ,cors ,superagent) application Dependencies:
//for express:
const express = require( 'express' );
//for cors:
const cors = require( 'cors' );
//for superagent: (HTTP request library)
const superagent = require( 'superagent' );
///////////////////////////////////////////////////end


///////////////////////////////////////////////////start
//3rd step application setup:
//for port:
const PORT = process.env.PORT || 5000;
//for server or app:
const server = express();
//for cors:
server.use( cors() );
///////////////////////////////////////////////////end


///////////////////////////////////////////////////start
//4th step create your routes:
//for home:
server.get( '/', homeRouteHandler );
//for location:
server.get( '/location', locationRouteHandler );
//for weather:
server.get( '/weather', weatherRouteHandler );
//for parks:
server.get('/parks', parksRouteHandler);
//for status:
server.get( '*', notFoundHandler );
///////////////////////////////////////////////////end


///////////////////////////////////////////////////start
//5th step create routes handler:
//for home:
function homeRouteHandler( req, res ) {
  res.send( 'your server is working' );
}
//for location:
function locationRouteHandler( req, res ) {
  //1st step get data from library:
  //from header Query string parameters//
  let cityName = req.query.city;
  console.log( cityName );
  //find key:
  let key = process.env.GEOCODE_API_KEY;
  //find url:
  let url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json`;

  //2nd step now we have to send request to API by SUPERAGENT(included KEY + URL):
  superagent.get( url )
    //3rd step now use .then to make callback function:
    .then( data => {
      //determine your data from where:
      let locData = data.body;
      //create new object for each location:
      let cityLocation = new Location( cityName, locData );
      console.log( cityLocation );
      //4th step send response:
      res.send( cityLocation );
    } );
}
//for weather:
function weatherRouteHandler( req, res ) {
  //1st step get data from library:
  //from header Query string parameters//
  let cityName = req.query.search_query;
  //find key:
  let key = process.env.WEATHER_API_KEY;
  //find url:
  let url = `https://api.weatherbit.io/v2.0/forecast/daily?city=${cityName}&key=${key}`;
  //2nd step now we have to send request to API by SUPERAGENT(included KEY + URL):
  superagent.get( url )
    //3rd step now use .then to make callback function:
    .then( data => {
      //determine your data from where:
      let weatherData = data.body;
      //create new object for each day:
      //refactor foreach to map So I add return and remove the push and the newArr (since the map already will return array)
      let arr = weatherData.data.map( val => {
        return new Weather( val )
      });
      //3rd send response:
      res.send( arr );
    });
}
//for parks:
function parksRouteHandler( req, res ) {
  //1st step get data from library:
  //from header Query string parameters//
  let cityName = req.query.search_query;
  //find key:
  let key = process.env.PARKS_API_KEY;
  //find url:
  let url = `https://developer.nps.gov/api/v1/parks?q=${cityName}&limit=10&api_key=${key}`;
  //2nd step now we have to send request to API by SUPERAGENT(included KEY + URL):
  superagent.get( url )
    //3rd step now use .then to make callback function:
    .then( data => {
      //determine your data from where:
      let parksData = data.body;
      //create new object for each day:
      //refactor foreach to map So I add return and remove the push and the newArr (since the map already will return array)
      let arr = parksData.data.map( val => {
        return new Parks ( val )
      });
      //3rd send response:
      res.send( arr );
    });
}
//for status:
function notFoundHandler( req, res ) {
  let errorObj = {
    status: 500,
    responseText: 'Sorry, something went wrong',
  };
  res.status( 500 ).send( errorObj );
}
///////////////////////////////////////////////////end


///////////////////////////////////////////////////start
//6th step create constructors:
//for location:
function Location ( cityName, data ) {
  this.search_query = cityName;
  this.formatted_query = data[0].display_name;
  this.latitude = data[0].lat;
  this.longitude = data[0].lon;
}
//for weather:
function Weather( data ) {
  this.forecast = data.weather.description;
  this.time = data.valid_date;
}
//for parks:
function Parks( data ) {
  this.name = data.fullName;
  this.address = `${data.addresses[0].line1}, ${data.addresses[0].city}, ${data.addresses[0].stateCode} ${data.addresses[0].postalCode}`;
  this.fee = data.entranceFees[0].cost;
  this.description = data.description;
  this.url = data.url;
}
///////////////////////////////////////////////////end


///////////////////////////////////////////////////start
//final step:
server.listen( PORT, () => {
  console.log( `listening on PORT ${PORT}` );
} );
///////////////////////////////////////////////////end
