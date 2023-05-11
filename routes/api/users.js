const express = require("express");
const router = express.Router();
const ctrUser = require("../../models/users");
const { auth } = require("../../models/users");
const upload = require("./../../utils/storage");

router.post("/signup", ctrUser.signup);

router.post("/login", ctrUser.login);

router.get("/logout", auth, ctrUser.logout);

router.get("/current", auth, ctrUser.current);

router.patch("/", auth, ctrUser.subscription);

router.patch("/avatars", upload.single("avatar"), auth, ctrUser.avatars);

router.get("verify/:verificationToken", auth, ctrUser.verify);

router.post("/verify", ctrUser.verifyAgain);

module.exports = router;
