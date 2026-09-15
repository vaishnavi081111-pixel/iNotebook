const mongoose = require("mongoose");

const ActivitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },

  action: {
    type: String,
    required: true,
  },

  message: {
    type: String,
    required: true,
  },

  noteId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "notes",
  },

  noteTitle: {
    type: String,
  },

  date: {
    type: Date,
    default: Date.now,
  },
});

const Activity = mongoose.model(
  "activity",
  ActivitySchema
);

module.exports = Activity;