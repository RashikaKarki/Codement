const mongoose =  require('mongoose');

let fileSchema = new mongoose.Schema({
  name: {type: String, required: true},
  path: {type: String, required: true},
  owner: {type: String, required: true},
  comments: [{type: mongoose.Schema.ObjectId, ref: 'comments'}],
  accessTo: [String]
});

let fileModel = mongoose.model('files', fileSchema);

module.exports = fileModel;
