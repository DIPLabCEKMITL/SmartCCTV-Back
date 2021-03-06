const express = require("express");
const users = express.Router();
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

const User = require("../models/User");
users.use(cors());

process.env.SECRET_KEY = "secret";

users.post("/register", (req, res) => {
  const today = new Date();
  const userData = {
    user_id: req.body.user_id,
    first_name: req.body.first_name,
    last_name: req.body.last_name,
    email: req.body.email,
    password: req.body.password,
    role: req.body.role,
    area_name: req.body.area_name,
    created: today,
  };

  User.findOne({
    where: {
      email: req.body.email,
    },
  })
    .then((user) => {
      if (!user) {
        bcrypt.hash(req.body.password, 10, (err, hash) => {
          userData.password = hash;
          User.create(userData)
            .then((user) => {
              res.json({ status: user.email + " Registered!" });
            })
            .catch((err) => {
              res.send("error: " + err);
            });
        });
      } else {
        res.json({ error: "User already exists" });
      }
    })
    .catch((err) => {
      res.send("error: " + err);
    });
});

users.post("/login", (req, res) => {
  User.findOne({
    where: {
      email: req.body.email,
    },
  })
    .then((user) => {
      if (user) {
        if (bcrypt.compareSync(req.body.password, user.password)) {
          let token = jwt.sign(user.dataValues, process.env.SECRET_KEY, {
            expiresIn: 1440,
          });
          res.send(token);
        }
      } else {
        res.status(400).json({ error: "User does not exist" });
      }
    })
    .catch((err) => {
      res.status(400).json({ error: err });
    });
});

users.get("/admin", (req, res) => {
  User.findAll({
    attributes: ["admin_id", "first_name", "last_name", "email"],
  }).then((result) => {
    if (result) {
      return res.send(result);
    }
  });
});

users.post("/delete", (req, res) => {
  const id = req.body.admin_id;
  User.destroy({
    where: {
      admin_id: id,
    },
  }).then(res.send("Success!"));
});

// change password
users.post("/changePassword", (req, res) => {
  const oldPassword = req.body.oldPassword;
  const newPassword = req.body.newPassword;
  const admin_id = req.body.admin_id;

  User.findOne({
    where: {
      admin_id: admin_id,
    },
  }).then((admin) => {
    if (admin) {
      if (bcrypt.compareSync(oldPassword, admin.password)) {
        bcrypt.hash(newPassword, 10, (err, hash) => {
          User.update({ password: hash }, { where: { admin_id: admin_id } })
            .then(res.send("Change password success!"))
            .catch((err) => {
              return res.send("error: " + err);
            });
        });
      } else {
        return res.send("Invalid Password");
      }
    }
  });
});

module.exports = users;
