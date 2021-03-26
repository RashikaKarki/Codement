const mongoose =  require('mongoose');

let fileSchema = new mongoose.Schema({
  name: {type: String, required: true},
  path: {type: String, required: true},
  owner: {type: mongoose.Schema.ObjectId, ref: 'users', required: true},
  comments: [{type: mongoose.Schema.ObjectId, ref: 'comments'}],
  accessTo: [{type: mongoose.Schema.ObjectId, ref: 'users'}]
});

let fileModel = mongoose.model('files', fileSchema);

module.exports = fileModel;
