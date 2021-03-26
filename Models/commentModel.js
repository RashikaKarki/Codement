const mongoose = require('mongoose');

let commentSchema = new mongoose.Schema({
  description: {type: String, required: true},
  createdAt: {type: Date, default: Date.now, required: true},
  createdBy: {type: mongoose.Schema.ObjectId, ref: 'users', required: true},
  lines:[Number]
});

let commentModel = mongoose.model('comments', commentSchema);

module.exports = commentModel;
