const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  email: String,
  firstName: String,
  lastName: String,
  password: String,
});

const User = mongoose.model("User", userSchema);
module.exports = User;
