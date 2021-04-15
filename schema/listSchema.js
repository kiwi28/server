const mongoose = require("mongoose");

const listSchema = mongoose.Schema({
  text: String,
  status: Boolean,
  ownerID: String,
  createdAt: Date,
});

const List = mongoose.model("List", listSchema);
module.exports = List;
