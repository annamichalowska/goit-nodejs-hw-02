const express = require("express");
const router = express.Router();
const ctrUser = require("../../models/users");
const { auth } = require("../../models/users");

router.post("/singup", ctrUser.signup);

router.post("/login", ctrUser.login);

router.get("/logout", auth, ctrUser.logout);

router.get("/current", auth, ctrUser.current);

module.exports = router;
