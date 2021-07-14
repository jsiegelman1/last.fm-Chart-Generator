const mongoose = require('mongoose');

const albumSchema = mongoose.Schema({
  name: String,
  artist: String,
  image: String,
  lfm_tags: [{tag: String, count: Number}]
});

const Album = mongoose.model('Album', albumSchema);

module.exports = Album;