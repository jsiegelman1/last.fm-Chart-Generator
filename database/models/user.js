const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
  username: String,
  sessionKey: String
});

const User = mongoose.model('User', userSchema);

module.exports = User;