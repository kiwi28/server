require("dotenv").config();
const ObjectId = require("mongodb").ObjectID;
const compression = require("compression");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const express = require("express");
const bcrypt = require("bcrypt");
const cors = require("cors");

const saltRounds = 10;

const app = express();

const User = require("./schema/userSchema.js");
const List = require("./schema/listSchema.js");

app.use(compression());
app.use(cors());

function verifyToken(req, res, next) {
  const token = req.headers["authorization"].split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.token = token;
    req.decoded = decoded;
    next();
  } catch (err) {
    console.log(err);
    res.status(403).json({ error: "Invalid token." });
  }
}

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

app.post("/", verifyToken, (req, res) => {
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
      return res.status(403).json({ error: "Invalid credentials" });
    }
  } catch (err) {
    return res.status(400).json({ error: err });
  }

  try {
    match = await bcrypt.compare(req.body.password, userFromDB.password);
    const returnedUserData = {
      id: userFromDB.id,
      email: userFromDB.email,
      firstName: userFromDB.firstName,
      lastName: userFromDB.lastName,
    };
    if (match) {
      const accessToken = jwt.sign(returnedUserData, process.env.JWT_SECRET);

      res.json({
        accessToken,
        userData: returnedUserData,
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
    return res.status(400).json({ error: "All fields are mandatory." });
  }

  let userFromDB;
  let newUser;
  try {
    userFromDB = await User.findOne({ email: req.body.email });
    if (userFromDB) {
      return res.status(400).json({ error: "This email is already in use." });
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
    return res.status(400).json({ error: err });
  }
});

app.post("/getUserItems", verifyToken, async (req, res) => {
  try {
    const userItems = await List.find({ ownerID: req.decoded.id }).sort({
      createdAt: -1,
    });
    return res.status(200).send({ data: { userItems: userItems } });
  } catch (err) {
    console.log(err);
    return res.status(400).send({ error: err });
  }
});

app.post("/createListItem", verifyToken, async (req, res) => {
  const todo = new List({
    ...req.body.todo,
    createdAt: new Date(),
    ownerID: req.decoded.id,
  });
  const { text, status, createdAt, ownerID, _id } = await todo.save();

  res.send({
    data: { createdListItem: { text, status, createdAt, ownerID, _id } },
  });
});

app.post("/editListItem", verifyToken, async (req, res) => {
  const { id, newData } = req.body.edit;
  console.log(newData);
  try {
    const edited = await List.updateOne(
      { _id: new ObjectId(id) },
      { $set: newData }
    );
    console.log(edited);
    if (!edited.n) {
      return res.status(405).send({ error: "Todo item not found." });
    } else if (!edited.nModified) {
      return res.status(405).send({
        error: "Error editig item. (probably item already has that values)",
      });
    }
    return res.send({ data: { editedItem: edited } });
  } catch (err) {
    console.log(err);
    return res.status(400).send({ error: err.message });
  }
});

app.post("/deleteListItems", verifyToken, async (req, res) => {
  console.log(req.body.itemsArray);
  Promise.all(
    req.body.itemsArray.map(async (itemID) => {
      const item = await List.findOneAndDelete({ _id: new ObjectId(itemID) });
      console.log(item);

      return item;
    })
  )
    .then((todoArr) => {
      return res.status(200).send({ data: { deletedItems: todoArr } });
    })
    .catch((err) => {
      return res.status(400).send({ error: err.message });
    });
});

app.post("/verify", (req, res) => {
  const token = req.headers.authorization.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.send({ data: { decoded } });
  } catch (err) {
    console.log(err);
    res.status(403).json({ error: err });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Example app listening at http://localhost:${process.env.PORT}`);
});
