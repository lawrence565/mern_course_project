import express from "express";
import {
  registerValidator as registerValidation,
  loginValidator as loginValidation,
} from "../validation.js";
import model from "../models/index.js";
import jwt from "jsonwebtoken";

const router = express.Router();
const User = model.User;

router.use((req, res, next) => {
  console.log("正在接收一個跟Auth 有關的請求");
  next();
});

router.get("/testAPI", (req, res) => {
  return res.send("成功連結auth routes....");
});

router.post("/register", async (req, res) => {
  // 確認註冊資訊是否符合規範
  let { error } = registerValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  // 確認是否被註冊過
  const emailExist = await User.findOne({ email: req.body.email });
  if (emailExist) return res.status(400).send("此信箱已被註冊");

  // 製作新用戶
  let { email, username, password, role } = req.body;
  let newUser = new User({
    username,
    email,
    password,
    role,
  });
  try {
    let savedUser = await newUser.save();
    return res.send({ msg: "使用者註冊成功", savedUser });
  } catch (e) {
    res.send(e);
  }
});

router.post("/login", async (req, res) => {
  let { error } = loginValidation(req.body);
  if (error) return res.status(400).send(error.details[0].message);

  const foundUser = await User.findOne({
    email: req.body.email,
  });
  if (!foundUser)
    return res.status(400).send("無法找到使用者，請確認信箱是否正確");

  foundUser.comparePassword(req.body.password, (err, isMatch) => {
    if (err) {
      return res.status(500).send(err);
    }
    if (isMatch) {
      // 製作Json Web Token
      const tokenObject = {
        _id: foundUser._id,
        email: foundUser.email,
      };
      const token = jwt.sign(tokenObject, process.env.PASSPORT_SECRET);
      return res.send({
        message: "成功登入",
        token: "JWT " + token,
        user: foundUser,
      });
    } else {
      return res.status(401).send("密碼錯誤");
    }
  });
});

export default router;
