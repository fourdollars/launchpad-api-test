function start_oauth(key) {
  var p1 = new Promise(
      function (resolve, reject) {
        function ready() {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.readyState === 4 && xhr.status === 200) {
              resolve(xhr.responseText);
            } else {
              reject('There was a problem with the request.');
            }
          }
        }

        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://staging.launchpad.net/+request-token');
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhr.onreadystatechange = ready;

        var data = 'oauth_consumer_key=' + key + '&oauth_signature_method=PLAINTEXT&oauth_signature=%26';
        xhr.send(data);
      });

  p1.then(
      function(val) {
        var vars = val.split('&');
        var oauth = {}
        for (var i = 0; i < vars.length; i++) {
          var pair = vars[i].split('=');
          oauth[pair[0]] = pair[1];
        }
        return oauth;
      })
  .then(
      function(oauth) {
        document.getElementById("result").innerHTML = "Please click " + 
          "<a id='oauth' href='https://staging.launchpad.net/+authorize-token?oauth_token=" +
          oauth.oauth_token + "' target='_blank'>here</a> to get the authorization.";
        document.getElementById("oauth").onclick = function () {
          document.getElementById("result").innerHTML = "Waiting for the authorization...";
          setTimeout(function () { process_oauth(oauth, key); }, 10000);
        }
      })
  .catch(
      function(err) {
        document.getElementById("result").innerHTML = err;
      });
}

function process_oauth(oauth, key) {
  var p2 = new Promise(
      function (resolve, reject) {
        function ready() {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.readyState === 4 && xhr.status === 200) {
              resolve(xhr.responseText);
            } else if (xhr.readyState === 4 && xhr.status === 401) {
              reject("Waiting for the authorization...");
              setTimeout(function () { process_oauth(oauth, key); }, 10000);
            } else {
              reject('There was a problem with the request.');
            }
          }
        }

        var xhr = new XMLHttpRequest();
        xhr.open('POST', 'https://staging.launchpad.net/+access-token');
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhr.onreadystatechange = ready;

        var data = 'oauth_consumer_key=' + key +
          '&oauth_token=' + oauth.oauth_token +
          '&oauth_signature_method=PLAINTEXT' +
          '&oauth_signature=%26' + oauth.oauth_token_secret;

        xhr.send(data);
      });

  p2.then(
      function(val) {
        var vars = val.split('&');
        var oauth = {}
        for (var i = 0; i < vars.length; i++) {
          var pair = vars[i].split('=');
          oauth[pair[0]] = pair[1];
        }
        return oauth;
      })
  .then(
      function(oauth) {
        if (oauth.hasOwnProperty('oauth_token') && oauth.hasOwnProperty('oauth_token_secret')) {
          localStorage.setItem('oauth_consumer_key', key);
          localStorage.setItem('oauth_token', oauth.oauth_token);
          localStorage.setItem('oauth_token_secret', oauth.oauth_token_secret);
          setTimeout(function () { lp_get('https://api.staging.launchpad.net/devel/launchpad?ws.op=searchTasks&status=In+Progress'); }, 0);
        }
      })
  .catch(
      function(err) {
        document.getElementById("result").innerHTML = err;
      });
}

function lp_get (url, collection, callback) {
  var p3 = new Promise(
      function (resolve, reject) {
        function ready() {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.readyState === 4 && xhr.status === 200) {
              resolve(xhr.responseText);
            } else {
              reject('There was a problem with the request.');
            }
          }
        }

        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.setRequestHeader("content-type", "text/plain");
        xhr.setRequestHeader('Accept', 'application/json');
        xhr.setRequestHeader('Authorization', 'OAuth realm="https://api.staging.launchpad.net/"' +
          ',oauth_consumer_key="' + localStorage.getItem('oauth_consumer_key') +
          '",oauth_token="' + localStorage.getItem('oauth_token') +
          '",oauth_signature_method="PLAINTEXT"' +
          ',oauth_signature="&' + localStorage.getItem('oauth_token_secret') +
          '",oauth_timestamp="' + new Date() / 1000 +
          '",oauth_nonce="' + Math.floor(Math.random() * new Date()) +
          '",oauth_version="1.0"');

        xhr.onreadystatechange = ready;

        xhr.send();
      });

  p3.then(
      function(val) {
        document.getElementById("result").innerHTML = JSON.stringify(val);
      })
  .catch(
      function(err) {
        document.getElementById("result").innerHTML = err;
      });
}

if (!localStorage.getItem('oauth_token') || !localStorage.getItem('oauth_token_secret')) {
  start_oauth('Launchpad API Test');
} else {
  setTimeout(function () { lp_get('https://api.staging.launchpad.net/devel/launchpad?ws.op=searchTasks&status=In+Progress'); }, 0);
}
