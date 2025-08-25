const express = require("express");
const router = express.Router();

// 根路由
router.get("/", (req, res) => {
  res.json({ message: "书城后端API" });
});

module.exports = router;
