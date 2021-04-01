const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const express = require("express");

const app = express();

const port = 4000;
const JWT_SECRET = "BJIOBiuosba93920";

const User = require("./schema/userSchema.js");

mongoose.connect(
  "mongodb+srv://kiwi28:parola123test@cluster0.kcnfo.mongodb.net/myFirstDatabase?retryWrites=true&w=majority",
  { useNewUrlParser: true, useUnifiedTopology: true }
);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("connected");
});

app.use(bodyParser.json());
// const jsonParser = bodyParser.json();

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.get("/auth", (req, res) => {
  res.send("de pae auth dasd asd asd ");
});

app.post("/register", (req, res) => {
  // console.log(req.body);
  if (
    !req.body.email ||
    !req.body.password ||
    !req.body.firstName ||
    !req.body.lastName
  ) {
    return res.status(400).json({ message: "All fields are mandatory" });
  }

  if (users.findIndex((el) => el.email === req.body.email) >= 0) {
    return res.status(400).json({ message: "This email is not available" });
  }

  const newUser = new User({
    email: req.body.email,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    password: req.body.password,
  });

  newUser.save();

  console.log(newUser);

  res.send(newUser);
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

const users = [
  {
    id: 1,
    email: "user@user.com",
    firstName: "Kiwi",
    lastName: "Alex",
    password: "qwerty",
  },
];
