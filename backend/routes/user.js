const express = require("express");
const router = express.Router();
const zod = require("zod");
const jwt = require("jsonwebtoken");
const { JWT_TOKEN } = require("../config");
const { User, Account } = require("../db");
const { authMiddleware } = require("../middleware");

const signupBody = zod.object({
  username: zod.string().email(),
  password: zod.string(),
  firstName: zod.string(),
  lastName: zod.string(),
});

const signInBody = zod.object({
  username: zod.string().email(),
  password: zod.string(),
});

const updateBody = zod.object({
  password: zod.string().optional(),
  firstName: zod.string().optional(),
  lastName: zod.string().optional(),
});

router.post("/signup", async (req, res) => {
  const { success } = signupBody.safeParse(req.body);
  if (!success) {
    return res.status(411).json({
      message: "Email already taken / Incorrect inputs",
    });
  }
  const user = await User.findOne({
    username: req.body.username,
  });
  if (user && user._id) {
    return res.status(411).json({
      message: "Email already taken / Incorrect inputs",
    });
  }
  const newUser = await User.create({
    username: req.body.username,
    password: req.body.password,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
  });
  const userId = newUser._id;

  await Account.create({ userId: userId, ammount: 1 + Math.random() * 10000 });

  const token = jwt.sign({ userId: userId }, JWT_TOKEN);

  return res.status(200).json({ message: "User created", token: token });
});
router.post("/signin", async (req, res) => {
  const { success } = signInBody.safeParse(req.body);
  if (!success) {
    return res
      .status(411)
      .json({ message: "Email already taken / Incorrect inputs" });
  }

  const signInUser = await User.findOne({
    username: req.body.username,
    password: req.body.password,
  });
  const userId = signInUser._id;
  req.userId = userId;
  if (signInUser) {
    const token = jwt.sign({ userId: signInUser._id }, JWT_TOKEN);
    return res.status(200).json({ token: token });
  }
  res.status(411).json({
    message: "Error while logging in",
  });
});
router.put("/", authMiddleware, async (req, res) => {
  const { success } = updateBody.safeParse(req.body);

  if (!success) {
    return res.status(411).json({ message: "invalid inputs" });
  }
  const user = await User.updateOne({ userId: req.userId }, req.body);
  return res.status(200).json({ message: "Updated Successfully" });
});
router.get("/bulk", authMiddleware, async (req, res) => {
  const filter = req.query.filter || "";
  const filteredData = await User.find({
    $or: [
      {
        firstName: {
          $regex: filter,
        },
      },
      {
        lastName: {
          $regex: filter,
        },
      },
    ],
  });
  return res.status(200).json({
    user: filteredData.map((user) => ({
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      id: user._id,
    })),
  });
});

module.exports = router;
