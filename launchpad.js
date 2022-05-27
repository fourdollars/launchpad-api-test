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
        let url = new URL('https://staging.launchpad.net/+authorize-token');
        url.searchParams.set('oauth_token', oauth.oauth_token);
        url.searchParams.set('allow_permission', 'READ_PUBLIC');
        document.getElementById("result").innerHTML = "Please click " + 
          "<a id='oauth' href='" + url + "' target='_blank'>here</a> to get the authorization.";
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
          setTimeout(function () { lp_get('https://api.staging.launchpad.net/devel/people/+me'); }, 0);
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
        url = new URL(url);
        url.searchParams.set('OAuth realm', 'https://api.staging.launchpad.net/');
        url.searchParams.set('oauth_consumer_key', localStorage.getItem('oauth_consumer_key'));
        url.searchParams.set('oauth_token', localStorage.getItem('oauth_token'));
        url.searchParams.set('oauth_signature_method', 'PLAINTEXT');
        url.searchParams.set('oauth_signature', '&' + localStorage.getItem('oauth_token_secret'));
        url.searchParams.set('oauth_timestamp', new Date() / 1000);
        url.searchParams.set('oauth_nonce', Math.floor(Math.random() * new Date()));
        url.searchParams.set('oauth_version', '1.0');
        xhr.open('GET', url);
        xhr.setRequestHeader("content-type", "text/plain");
        xhr.setRequestHeader('Accept', 'application/json');

        xhr.onreadystatechange = ready;

        xhr.send();
      });

  p3.then(
      function(val) {
        let json = JSON.parse(val);
          document.getElementById("result").innerHTML = 'Hi <a href="' + json['web_link'] + '" target="_blank">' + json['display_name'] + '</a>';
      })
  .catch(
      function(err) {
        document.getElementById("result").innerHTML = err;
      });
}

if (!localStorage.getItem('oauth_token') || !localStorage.getItem('oauth_token_secret')) {
  start_oauth('Launchpad API Test');
} else {
  setTimeout(function () { lp_get('https://api.staging.launchpad.net/devel/people/+me'); }, 0);
}
