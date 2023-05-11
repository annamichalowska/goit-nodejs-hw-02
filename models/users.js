const service = require("../service");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const path = require("path");
const fs = require("fs");
const { promisify } = require("util");
const jimp = require("jimp");
const nodemailer = require("nodemailer");
const uuidv4 = require("uuid").v4;
const {
  existingUser,
  saveNewUser,
  loginResponse,
  findUserByIdAndToken,
} = require("../service/index");
const { validateUser } = require("../service/validator");

const signup = async (req, res, next) => {
  const { error } = validateUser(req.body);
  const { email } = req.body;
  const avatarURL = gravatar.url(email, { s: "200", r: "pg", d: "mp" }, true);

  try {
    const result = await service.existingUser({ email });
    if (result) {
      return res.status(409).json({ message: "Email in use" });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const verificationToken = uuidv4();

    const newUser = {
      email: req.body.email,
      password: hashedPassword,
      verificationToken,
    };

    const savedUser = await saveNewUser(newUser);
    await savedUser.save();

    await sendVerificationEmail(savedUser.email, verificationToken);

    return res.status(201).json({
      user: {
        email: savedUser.email,
        subscription: savedUser.subscription,
        avatarURL: savedUser.avatarURL,
      },
    });
  } catch (e) {
    console.error(e);
    res.status(404).json({ message: "Not found" });
  }
};

const sendVerificationEmail = async (email, verificationToken) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.mailtrap.io",
    port: 2525,
    secure: false,
    auth: {
      user: "c7ab0a7b377b91",
      pass: "6eb4105b8fc3d5",
    },
    requireTLS: true,
  });
  const verificationLink = `http://localhost:3000/users/verify/${verificationToken}`;

  const mailOptions = {
    from: "c7ab0a7b377b91",
    to: email,
    subject: "Email Verification",
    test: `Please click the following link to verify your email: ${verificationLink}`,
  };

  await transporter.sendMail(mailOptions);
};

const login = async (req, res, next) => {
  const { error, value } = validateUser(req.body);
  const { email, password } = value;

  try {
    if (error) {
      return res.status(400).json({ message: "Validation error" });
    }

    const user = await service.existingUser({ email });

    const hash = await bcrypt.hash(password, 10);
    if (!user || (await bcrypt.compare(hash, user.password))) {
      return res.status(401).json({ message: "Email or password is wrong" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    user.token = token;
    await user.save();

    return loginResponse(res, token, user.email, user.subscription);
  } catch (e) {
    res.status(500).json({ message: "Internal server error" });
  }
};

const auth = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(" ")[1];
    if (!token) return req.status(401).json({ message: "Not authorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await findUserByIdAndToken(decoded.userId, token);

    if (!user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
};

const logout = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    user.token = null;
    await user.save();

    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).send();
    next(e);
  }
};

const current = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    res.status(200).json({
      email: user.email,
      subscription: user.subscription,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const subscription = async (req, res, next) => {
  const { subscription } = req.body;
  const userId = req.user.id;
  const allowedSubscriptions = ["starter", "pro", "business"];
  if (!allowedSubscriptions.includes(subscription)) {
    return res.status(400).json({ message: "Invalid subscription type" });
  }
  try {
    const user = await service.updateSubscriptionUser(userId, { subscription });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ user });
  } catch (e) {
    next(e);
  }
};

const avatars = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No file provided" });
    }

    const image = await jimp.read(file.path);
    image.resize(250, 250);
    await image.writeAsync(file.path);

    const avatarName = file.filename;
    const avatarPath = path.join(
      process.cwd(),
      "public",
      "avatars",
      avatarName
    );
    await promisify(fs.rename)(file.path, avatarPath);

    const avatarURL = `/avatars/${avatarName}`;
    user.avatarURL = avatarURL;
    await user.save();

    res.status(200).json({ avatarURL });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const verify = async (req, res, next) => {
  const { verificationToken } = req.params;

  try {
    const user = await service.findUserByToken(verificationToken);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.verificationToken = null;
    user.verify = true;
    await user.save();

    return res.status(200).json({ message: "Verification successful" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

const verifyAgain = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ message: "Missing required field email" });
  }

  try {
    const user = await service.existingUser({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.verify) {
      return res
        .status(400)
        .json({ message: "Verification has already been passed" });
    }

    const verificationToken = uuidv4();

    user.verificationToken = verificationToken;
    await user.save();

    await sendVerificationEmail(user.email, verificationToken);

    return res.status(200).json({ message: "Verification email sent" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = {
  signup,
  sendVerificationEmail,
  login,
  auth,
  logout,
  current,
  subscription,
  avatars,
  verify,
  verifyAgain,
};
