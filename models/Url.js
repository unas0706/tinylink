const mongoose = require("mongoose");

const urlSchema = new mongoose.Schema(
  {
    longUrl: { type: String, required: true },
    shortId: { type: String, required: true, unique: true },
    clicks: { type: Number, default: 0 },
    lastClicked: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Url", urlSchema);
