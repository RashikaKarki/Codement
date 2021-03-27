const mongoose =  require('mongoose');

let userSchema = new mongoose.Schema({
  name: {type: String, required: true},
  userName: {type: String, required: true},
  accessFiles: [{type: mongoose.Schema.ObjectId, ref: 'files'}]
});

let userModel = mongoose.model('users', userSchema);

module.exports = userModel;
