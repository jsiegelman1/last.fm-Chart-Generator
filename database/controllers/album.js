const Album = require('../models/album.js');

const addAlbum = (title, artist, img, tags) => {
  Album.findOneAndUpdate({'name': title, 'artist': artist}, {'name': title, 'artist': artist, 'lfm_tags': tags, 'image': img}, {upsert: true, new: true}, (err, record) => {
    if(record.lfm_tags.length <= -1) {
      console.log(record);
    }
  });
};

const getTags = (title, cb) => {
  Album.findOne({'name': title}, 'lfm_tags', (err, data) => {
    if(err) {
      console.log(err);
    } else {
      cb(data);
    }
  })
};

const getManyTags = (titles, cb) => {
  Album.find({'name': {
    $in: titles
  }}, 'name lfm_tags', (err, data) => {
    if(err) {
      console.log(err);
    } else {
      //var missing = titles.filter(t => !data.map(d => d.name).includes(t));
      cb(data);
    }
  })
};

module.exports = {addAlbum: addAlbum, getTags: getTags, getManyTags: getManyTags};