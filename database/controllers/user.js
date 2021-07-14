const User = require('../models/user.js');

const addUser = (username, session) => {
  User.findOneAndUpdate({'username': username, 'sessionKey': session}, {}, {upsert: true, new: true}, (err, record) => {
    console.log(err, record);
  });
};

module.exports = {addUser: addUser};