const mongoose = require('mongoose');

let commentSchema = new mongoose.Schema({
  description: {type: String, required: true},
  createdAt: {type: Date, default: Date.now, required: true},
  createdBy: {type: String, required: true},
  lines: Number,
  fileName: {type: String, required: true}
});

let commentModel = mongoose.model('comments', commentSchema);

module.exports = commentModel;
