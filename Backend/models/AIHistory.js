const mongoose = require("mongoose");

const AIHistorySchema = new mongoose.Schema(
  {
    /* ========================================================
       USER
    ======================================================== */

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user",
      required: true,
      index: true,
    },

    /* ========================================================
       TYPE
       chat       → normal AI conversation
       note-action → summarize / explain / MCQ / flashcards /
                     improve / ask
    ======================================================== */

    type: {
      type: String,
      enum: ["chat", "note-action"],
      default: "chat",
      required: true,
    },

    /* ========================================================
       ACTION
       Example:
       chat
       summarize
       explain
       mcq
       flashcards
       improve
       ask
    ======================================================== */

    action: {
      type: String,
      default: null,
      trim: true,
    },

    /* ========================================================
       TITLE
    ======================================================== */

    title: {
      type: String,
      default: "AI Conversation",
      trim: true,
      maxlength: 200,
    },

    /* ========================================================
       USER PROMPT
    ======================================================== */

    prompt: {
      type: String,
      default: "",
      trim: true,
      maxlength: 10000,
    },

    /* ========================================================
       AI RESPONSE
    ======================================================== */

    response: {
      type: String,
      default: "",
      maxlength: 30000,
    },

    /* ========================================================
       NUMBER OF NOTES USED
    ======================================================== */

    noteCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    /* ========================================================
       OPTIONAL NOTE ID
       If AI action is related to one particular note
    ======================================================== */

    noteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "notes",
      default: null,
    },

    /* ========================================================
       CREATED DATE
    ======================================================== */

    date: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

/* ============================================================
   INDEX
   Helps fetch one user's latest AI history quickly.
============================================================ */

AIHistorySchema.index({
  user: 1,
  date: -1,
});

module.exports = mongoose.model(
  "AIHistory",
  AIHistorySchema
);