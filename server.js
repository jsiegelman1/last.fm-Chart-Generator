const config = require('./config.js');
const db = require('./database/index.js');
const User = require('./database/controllers/user.js');
const Album = require('./database/controllers/album.js');
const mergeImages = require('merge-images');
const fs = require('fs');
const { Canvas, Image } = require('node-canvas');
const { createCanvas } = require('canvas');


const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const md5 = require('crypto-js/md5');
const xml = require('xml2js');
const axios = require('axios');
const app = express();

const API_URL = 'http://ws.audioscrobbler.com/2.0/';

const PORT = 3000;

const IMG_SIZE = 300;
const NUM_ROWS = [1, 2, 3, 4, 5];

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/", express.static('./client/dist'));
app.get('/auth', (req, res) => {
  var token = req.query.token;
  callSigned({ method: 'auth.getSession', token: token }, api_res => {
    var username = api_res.data.session.name;
    var session = api_res.data.session.key;
    User.addUser(username, session);
  });
  res.redirect('/');
});

app.post('/artists', (req, res) => {
  callUnsigned({ method: 'user.getTopArtists', user: req.body.name }, api_res => {
    var artists = api_res.data.topartists.artist;
    res.write(JSON.stringify(artists.map(e => e.name)));
    res.end();
  });

});

app.post('/albums', (req, res) => {
  callUnsigned({ method: 'user.getTopAlbums', user: req.body.name, period: req.body.period, limit: 100 }, api_res => {
    var albums = api_res.data.topalbums.album;
    albums.forEach(a => {
      Album.getTags(a.name, data => {
        if (data === null) {
          console.log('getting tags for ' + a.name);
          getAlbumTags(a);
        }
      })
    });
    renderTop(albums.slice(0, 9).map(a => a.image[3]['#text']), req.body.anonymous ? 'Top albums' : 'Top albums for user ' + req.body.name, (err, img) => {
      if (!err) {
        res.write(img);
      }
      res.end();
    }, req.body.size);
  });
});

app.post('/tags', (req, res) => {
  callUnsigned({ method: 'user.getTopAlbums', user: req.body.name, period: req.body.period, limit: 100 }, api_res => {
    var albums = api_res.data.topalbums.album;
    Album.getManyTags(albums.map(a => a.name), d => {
      var tagAlbums = d.filter(record => {
        return record.lfm_tags.map(f => f.tag).includes(req.body.tag)
      }).map(a => a.name);
      var urls = albums.filter(a => tagAlbums.includes(a.name)).map(a => a.image[3]['#text']);
      renderTop(urls, req.body.anonymous ? 'Top albums with tag \"' + req.body.tag + '\"' : 'Top albums for user ' + req.body.name + ' with tag \"' + req.body.tag + '\"', (err, img) => {
        if (!err) {
          res.write(img);
        }
        res.end();
      }, req.body.size);
    });
  });

});

app.post('/sample', (req, res) => {
  callUnsigned({ method: 'user.getTopAlbums', user: req.body.name, period: req.body.period, limit: 100 }, api_res => {
    var albums = api_res.data.topalbums.album;
    //get most common tags
    //for each tag, get the most listened to album
    Album.getManyTags(albums.map(a => a.name), d => {
      var tagObj = d.reduce((acc, album) => {
        album.lfm_tags.forEach(tag => {
          if (acc[tag.tag]) {
            acc[tag.tag]++;
          } else {
            //console.log('added tag ' + tag.tag);
            acc[tag.tag] = 1;
          }
        });
        return acc;
      }, {});
      var tagAlbums = [];
      var mostCommon = Object.keys(tagObj).sort((a, b) => tagObj[b] - tagObj[a]);
      mostCommon.slice(0, 20).forEach(t => {
        for (var i = 0; i < d.length; i++) {
          //console.log(d[i].name, albums[i].name);
          if (d[i].lfm_tags.map(tag => tag.tag).includes(t) && !tagAlbums.includes(d[i].name)) {
            //console.log('Found ' + d[i].name + ' for tag ' + t + ' at position ' + i);
            tagAlbums.push(d[i].name)
            break;
          }
        }
      });
      //console.log(albums);
      var images = tagAlbums.map(a => {
        var img;
        albums.forEach(album => {
          if(album.name === a) {
            img = album.image[3]['#text'];
          }
        });
        return img;
      })
      renderTop(images, req.body.anonymous ? 'Sample of Most Common Tags' : 'Sample of ' + req.body.name + '\'s Most Common Tags', (err, img_data) => {
        if (!err) {
          res.write(img_data);
        }
        res.end();
      }, req.body.size);
    });
  });

});

app.listen(PORT, function () {
  console.log(`Server listening at http://localhost:${PORT}`);
});

const renderTop = (urls, header, cb, size) => {
  var per_row = Number(size);
  if (per_row === -1) {
    for (var i = 0; i < NUM_ROWS.length; i++) {
      if (urls.length >= NUM_ROWS[i] * NUM_ROWS[i]) {
        per_row = NUM_ROWS[i];
      }
    }
  }
  var offset = 0;
  var images = [];
  if (header) {
    offset = 20;
    const canvas = createCanvas(IMG_SIZE * (Math.floor(urls.length / per_row)), offset)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "black";
    ctx.font = '15px Arial';
    ctx.fillText(header, 5, 15);
    images.push({ src: canvas.toDataURL(), x: 0, y: 0 })
  }
  var f = images.concat(urls.map((e, idx) => {
    return { src: e, x: IMG_SIZE * (idx % per_row), y: offset + (IMG_SIZE * Math.floor(idx / per_row)) };
  })).slice(0, per_row * per_row + 1);
  mergeImages(f, {
    Canvas: Canvas,
    Image: Image,
    width: f.length < per_row ? IMG_SIZE * f.length / per_row : IMG_SIZE * per_row,
    height: offset + IMG_SIZE * (Math.floor(f.length / per_row))
  }).then(d => {
    cb(null, d);
  }).catch(err => {
    cb(err, null);
  });


}

const getAlbumTags = (album) => {
  callUnsigned({ method: 'album.getTopTags', artist: album.artist.name, album: album.name }, api_res => {
    if (api_res.error === undefined) {
      var tags = api_res.data.toptags.tag;
      Album.addAlbum(album.name, album.artist.name, album.image[3]['#text'], tags.filter(t => t.count > 10).map(t => { return { tag: t.name, count: t.count } }));
    }

  });
};

const callSigned = (params, cb) => {
  params.api_key = config.key;
  var keys = Object.keys(params);
  var sig = '';
  keys.sort();
  keys.forEach((key) => {
    sig += key + params[key];
  })
  sig += config.secret;
  params.api_sig = md5(sig).toString();
  params.format = 'json';
  var p = [];
  for (var key in params) {
    p.push(key + '=' + params[key])
  }
  var endpoint = '?' + p.join('&');

  axios.post(API_URL + endpoint).then(cb).catch(err => console.log(err));
};

const callUnsigned = (params, cb) => {
  params.api_key = config.key;
  params.format = 'json';
  var p = [];
  for (var key in params) {
    p.push(key + '=' + params[key])
  }
  var endpoint = '?' + p.join('&');
  axios.get(API_URL + endpoint).then(cb).catch(err => console.log('Axios error:', err, params));
};