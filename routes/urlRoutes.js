const express = require("express");
const router = express.Router();
const Url = require("../models/Url");
const { createShortUrl, redirectUrl } = require("../controllers/urlController");

// Home Page (SSR)
router.get("/", async (req, res) => {
  const urls = await Url.find().sort({ createdAt: -1 });
  // Provide default locals for template to avoid ReferenceError when fields are missing
  res.render("index", { urls, error: null, success: null });
});

// Form submission → create short URL (SSR)
router.post("/shorten", async (req, res) => {
  await createShortUrl(req, res);
});

// Stats page for a code
router.get("/code/:shortId", async (req, res) => {
  // render stats page
  const shortId = req.params.shortId;
  try {
    const Url = require("../models/Url");
    const link = await Url.findOne({ shortId });
    if (!link) {
      return res
        .status(404)
        .render("stats", { link: null, error: "Link not found" });
    }
    return res.render("stats", { link, error: null });
  } catch (err) {
    return res
      .status(500)
      .render("stats", { link: null, error: "Server error" });
  }
});

// Short URL redirect
router.get("/:shortId", redirectUrl);

module.exports = router;
