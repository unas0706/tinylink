const express = require("express");
const router = express.Router();

const start = Date.now();

router.get("/", (req, res) => {
  res.json({ ok: true, version: "1.0" });
});

module.exports = router;
