const http = require('http');
const port = 7000;

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
  } else {
    res.statusCode = 404;
    res.end();
  }
}).listen(port, console.log(`listening on port ${port}`));
