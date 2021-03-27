const mongoose =  require('mongoose');

let userSchema = new mongoose.Schema({
  name: {type: String, required: true},
  userName: {type: String, required: true},
  accessFiles: [String]
});

let userModel = mongoose.model('users', userSchema);

module.exports = userModel;
