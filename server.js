'use strict';

const express = require( 'express' );
require( 'dotenv' ).config();
const server = express();

const cors = require( 'cors' );


const PORT = process.env.PORT || 5000;

server.use( cors() );


server.get( '/',( req,res )=>{
  res.send( 'you server is working' );
} );

// For Location:
//create Route for location:
server.get( '/location', ( req, res ) => {
  //1st step get data from location file:
  let locationData = require( './data/location.json' );

  //2nd step create new obj:
  let cityLocation = new Location( locationData );

  //3rd step send response:
  res.send( cityLocation );
  console.log( cityLocation );
} );

//create constructor for location data which will target these data:
// {
//     "search_query": "seattle",
//     "formatted_query": "Seattle, WA, USA",
//     "latitude": "47.606210",
//     "longitude": "-122.332071"
//   }
function Location( data ) {
  this.search_query = 'Lynwood';
  this.formatted_query = data[0].display_name;
  this.latitude = data[0].lat;
  this.longitude = data[0].lon;
}



//For Weather:
//create Route for weather:
server.get( '/weather', ( req, res ) => {
  let newArr = [];
  //1st get data from weather file:
  let weatherData = require( './data/weather.json' );

  //2nd create new obj:
  weatherData.data.forEach( ( val,item ) =>{
    let cityWeather = new Weather( weatherData.data[item] );
    newArr.push( cityWeather );
  } );

  //3rd send response:
  res.send( newArr );

} );

//create constructor for weather data which will target these data for 5 days:
// [
//     {
//       "forecast": "Partly cloudy until afternoon.",
//       "time": "Mon Jan 01 2001"
//     },
//     {
//       "forecast": "Mostly cloudy in the morning.",
//       "time": "Tue Jan 02 2001"
//     },
//     ...
//   ]

function Weather( data ) {
  this.forcast = data.weather.description;
  this.time = data.valid_date;
}


server.get( '*',( req,res ) =>{
  let errorObj = {
    status: 500,
    responseText: 'Sorry, something went wrong',
  };
  res.status( 500 ).send( errorObj );
} );


server.listen( PORT, () => {
  console.log( `listening on PORT ${PORT}` );
} );
