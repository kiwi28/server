require("dotenv").config();
const bodyParser = require("body-parser");
const compression = require("compression");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");
const saltRounds = 10;

const app = express();

const User = require("./schema/userSchema.js");

app.use(compression());
app.use(cors());

mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function () {
  console.log("connected");
});

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("123 123");
});

app.post("/auth", async (req, res) => {
  let userFromDB;
  let match;
  try {
    userFromDB = await User.findOne({
      email: req.body.email,
    });

    if (!userFromDB) {
      return res.status(400).json({ error: "Invalid credentials" });
    }
  } catch (err) {
    return res.status(400).json({ error: err });
  }

  try {
    match = await bcrypt.compare(req.body.password, userFromDB.password);

    if (match) {
      const accessToken = jwt.sign(
        {
          email: userFromDB.email,
          firstName: userFromDB.firstName,
          lastName: userFromDB.lastName,
        },
        process.env.JWT_SECRET
      );

      res.json({
        accessToken,
      });
    } else {
      return res.status(400).json({ error: "Invalid credentials" });
    }
  } catch (err) {
    return res.status(400).json({ error: err });
  }
});

app.post("/register", async (req, res) => {
  if (
    !req.body.email ||
    !req.body.password ||
    !req.body.firstName ||
    !req.body.lastName
  ) {
    return res.status(400).json({ message: "All fields are mandatory." });
  }

  let userFromDB;
  let newUser;
  try {
    userFromDB = await User.findOne({ email: req.body.email });
    if (userFromDB) {
      return res.status(400).json({ message: "This email is already in use." });
    } else {
      newUser = new User({
        email: req.body.email,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        password: req.body.password,
      });
    }

    const salt = bcrypt.genSaltSync(saltRounds);
    newUser.password = bcrypt.hashSync(newUser.password, salt);

    const savedUser = await newUser.save();

    return res.send({
      email: savedUser.email,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
    });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ message: err });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Example app listening at http://localhost:${process.env.PORT}`);
});
