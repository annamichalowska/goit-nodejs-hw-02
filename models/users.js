const service = require("../service");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
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

  try {
    const result = await service.existingUser({ email });
    if (result) {
      return res.status(409).json({ message: "Email in use" });
    }

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const newUser = {
      email: req.body.email,
      password: hashedPassword,
    };
    const savedUser = await saveNewUser(newUser);

    return res.status(201).json({
      user: {
        email: savedUser.email,
        subscription: savedUser.subscription,
      },
    });
  } catch (e) {
    res.status(404).json({ message: "Not found" });
  }
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
  const userId = req.user.id;
  const user = await service.findUserById(userId);

  try {
    if (!user) {
      return res.status(401).json({ message: "Not authorized" });
    }

    user.token = [];
    await user.save();

    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).send();
    next(e);
  }
};

const current = async (req, res, next) => {
  const userId = req.user.id;
  const user = await service.findUserById(userId);

  try {
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

module.exports = {
  signup,
  login,
  auth,
  logout,
  current,
  subscription,
};
