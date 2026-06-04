const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    author: {
      type: String,
      required: true,
      trim: true,
    },

    text: {
      type: String,
      required: true,
    },

    time: {
      type: String,
    },

    // ─── Room field ───
    room: {
      type: String,
      default: "general",
      index: true,      // fast queries by room
    },

    // ─── Reply-to: stores _id + author + text of original ───
    replyTo: {
      _id: { type: String, default: null },
      author: { type: String, default: null },
      text: { type: String, default: null },
    },

    reactions: {
      type: Map,
      of: Number,
      default: {},
    },

    edited: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Message", messageSchema);
