const http = require('http');
const https = require('https');

const port = 7000;
const apiKey = process.env.DARKSKY_API_KEY;
const cities = {
  london: {
    lat: 51.507222,
    lng: -0.1275
  },
  sydney: {
    lat: -33.865,
    lng: 151.209444
  }
};

function getWeather(city) {
  return new Promise((resolve, reject) => {
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
          reject(error);
        }

        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', chunk => rawData += chunk);
        res.on('end', () => {
          try {
            const parsedData = JSON.parse(rawData);
            resolve(parsedData);
          } catch (e) {
            reject(e.message);
          }
        });
      }).on('error', e => {
        reject(`Got error: ${e.message}`);

      });
  });

}

http.createServer((req, res) => {
  const {method, url} = req;
  if(method === 'POST' && url === '/echo') {
    let body = [];
    req.on('error', err => {
      console.error(err);
    }).on('data', chunk => {
      body.push(chunk);
    }).on('end', () => {
      body = Buffer.concat(body).toString();
      res.end(body);
    });
  } else if(method === 'GET' && (url === '/sydney' || url === '/london')) {
    const city = url.slice(1);
    getWeather(city)
      .then(weather => {
        console.log(weather);
        res.end(weather.hourly.summary);
      })
      .catch(error => res.end(error));
  } else {
    res.statusCode = 404;
    res.end();
  }
}).listen(port, console.log(`listening on port ${port}`));
