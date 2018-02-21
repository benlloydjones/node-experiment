'use strict';

const apiKey = process.env.DARKSKY_API_KEY;
const cities = {
  London: {
    lat: 51.507222,
    lng: -0.1275
  },
  Sydney: {
    lat: -33.865,
    lng: 151.209444
  }
};

const Alexa = require('alexa-sdk');
const https = require('https');

function getWeather(city) {
  https
    .get(`https://api.darksky.net/forecast/${apiKey}/${cities[city].lat},${cities[city].lng}`, res => {
      const { statusCode } = res;
      const contentType = res.headers['content-type'];
      let error = null;
      if (statusCode !== 200) {
        error = new Error('Request Failed.\n' +
                          `Status Code: ${statusCode}`);
      } else if (!/^application\/json/.test(contentType)) {
        error = new Error('Invalid content-type.\n' +
                          `Expected application/json but received ${contentType}`);
      }
      if (error) {
        res.resume();
        return error;
      }

      res.setEncoding('utf8');
      let rawData = '';
      res.on('data', chunk => rawData += chunk);
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(rawData);
          return parsedData;
        } catch (e) {
          console.error(e.message);
        }
      });
    }).on('error', e => {
      console.error(`Got error: ${e.message}`);

    });
}

const handlers = {
  'LaunchRequest': function() {
    this.response.speak('Hello, welcome to Ben\'s weather app.').listen('Which city would you like to get the weather for?');
    this.emit(':responseReady');
  },
  'WeatherIntent': function() {
    const city = this.event.request.intent.slots.city.value;
    if(city !== 'london' || city !== 'sydney') {
      this.response.speak('I do not know the weather in that city');
      this.emit(':responseReady');
    } else {
      new Promise((resolve, reject) => {
        const weather = getWeather(city);
        if(typeof weather !== Error) {
          resolve(weather);
        } else {
          reject(weather);
        }
      })
        .then(weather => {
          this.response.speak(weather);
          this.emit(':responseReady');
        })
        .catch(error => {
          this.response.speak(error);
          this.emit(':responseReady');
        });
    }
  }
};

exports.handler = function(event, context){
  const alexa = Alexa.handler(event, context);
  alexa.registerHandlers(handlers);
  alexa.execute();
};
