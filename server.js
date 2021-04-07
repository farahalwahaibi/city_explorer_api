/* eslint-disable indent */
/* eslint-disable camelcase */
/* eslint-disable no-redeclare */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
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
//for pg:
const pg = require( 'pg' );
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
//for pg (to make our server as client):
const client = new pg.Client( {
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized:false
  }
} );
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
server.get( '/parks', parksRouteHandler );
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
  //get city from request url:
  let cityName = req.query.city;
  //find key:
  let key = process.env.GEOCODE_API_KEY;
  //find url:
  let url = `https://eu1.locationiq.com/v1/search.php?key=${key}&q=${cityName}&format=json`;
  //go to database and select data from it:
  let SQL = 'SELECT DISTINCT * FROM locations WHERE search_query=$1';
  //make value safe:
  let safeValues = [cityName];
  //check for city if it's exist in database by:
  //1- send request to pg to check:
  client.query( SQL, safeValues )
    .then( result => {
      if ( result.rowCount > 0 ) { //that if the data exist send it//
        res.send( result.rows[0] );
      }
      else if ( result.rowCount <= 0 ) {
        //now we have to send request to API by SUPERAGENT(included KEY + URL):
        superagent.get( url )
          //now use .then to make callback function (promise):
          .then( data => {
          //determine your data from where:
          let locData = data.body;
          //create new object for each location:
          let cityLocation = new Location( cityName, locData );
          //then I need to send the data:
          let search_query = cityName;
          let formatted_query = cityLocation.formatted_query;
          let latitude = cityLocation.latitude;
          let longitude = cityLocation.longitude;
          res.send( cityLocation );
          //after sent the data need to insert it inside the database:
          let SQL = 'INSERT INTO locations (search_query,formatted_query,latitude,longitude) VALUES ($1,$2,$3,$4) RETURNING *;';
          let safeValues = [search_query, formatted_query, latitude, longitude];
          client.query( SQL, safeValues );
        } )
            .catch( error => {
              res.send( error );
            } ) ;
      }
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
        return new Weather( val );
      } );
      //3rd send response:
      res.send( arr );
    } );
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
        return new Parks( val );
      } );
      //3rd send response:
      res.send( arr );
    } );
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
function Location( cityName, data ) {
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
//connect our express server to postgress:
client.connect()
  .then( () => {
    server.listen( PORT, () => {
      console.log( `listening on PORT ${PORT}` );
    } );
  } );

///////////////////////////////////////////////////end
