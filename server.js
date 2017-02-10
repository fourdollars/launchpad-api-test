var http = require('http');
var fs = require('fs');
var request = require('request');
var replaceStream = require('replacestream');
//require('request-debug')(request);

var server = http.createServer(function(req, res) {
  switch (req.method) {
    case 'GET':
      if (req.url == '/') {
        fs.createReadStream('./launchpad.html').pipe(res);
      } else if (req.url == '/launchpad.js') {
        fs.createReadStream('./launchpad.js')
          .pipe(replaceStream('https://staging.launchpad.net/+request-token', '/+request-token'))
          .pipe(replaceStream('https://staging.launchpad.net/+access-token', '/+access-token'))
          .pipe(replaceStream('https://api.staging.launchpad.net/devel/', '/devel/'))
          .pipe(res);
      } else if (req.url.startsWith('/devel/')) {
        var x = request('https://api.staging.launchpad.net' + req.url);
        req.pipe(x);
        x.pipe(res);
      } else {
        console.log(req.url + ' not found');
        res.statusCode = 404;
        res.end();
      }
      break;
    case 'POST':
      if (req.url == '/+request-token') {
        var x = request('https://staging.launchpad.net/' + req.url);
        req.pipe(x);
        x.pipe(res);
      } else if (req.url == '/+access-token') {
        var x = request('https://staging.launchpad.net/' + req.url);
        req.pipe(x);
        x.pipe(res);
      }
      break;
  }
});
console.log('http://localhost:3000');
server.listen(3000);
