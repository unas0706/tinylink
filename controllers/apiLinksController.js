const Url = require("../models/Url");
const { nanoid } = require("nanoid");

const CODE_REGEX = /^[A-Za-z0-9]{6,8}$/;

// POST /api/links
exports.createLink = async (req, res) => {
  try {
    const { longUrl, customCode } = req.body || {};
    if (!longUrl) return res.status(400).json({ error: "longUrl is required" });

    // Validate URL format and scheme
    try {
      const parsed = new URL(longUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return res
          .status(400)
          .json({ error: "Invalid URL scheme (must be http or https)" });
      }
    } catch (err) {
      return res.status(400).json({ error: "Invalid URL format" });
    }

    let shortId;
    if (customCode) {
      if (!CODE_REGEX.test(customCode)) {
        return res
          .status(400)
          .json({ error: "Custom code must match [A-Za-z0-9]{6,8}" });
      }
      const exists = await Url.findOne({ shortId: customCode });
      if (exists) return res.status(409).json({ error: "Code already exists" });
      shortId = customCode;
    } else {
      // generate until unique (small loop)
      let attempts = 0;
      do {
        shortId = nanoid(6);
        const exists = await Url.findOne({ shortId });
        if (!exists) break;
        attempts++;
      } while (attempts < 5);
      // if still exists, extend length
      if (attempts >= 5) shortId = nanoid(8);
    }

    const created = await Url.create({ longUrl, shortId });

    return res.status(201).json({
      shortId: created.shortId,
      originalUrl: created.longUrl,
      shortUrl: `${
        process.env.BASE_URL || "http://localhost:" + (process.env.PORT || 3000)
      }/${created.shortId}`,
    });
  } catch (err) {
    if (err && err.code === 11000)
      return res.status(409).json({ error: "Code already exists" });
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
};

// GET /api/links
exports.listLinks = async (req, res) => {
  try {
    const links = await Url.find().sort({ createdAt: -1 });
    return res.json(links);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch links" });
  }
};

// GET /api/links/:code
exports.getLink = async (req, res) => {
  try {
    const code = req.params.code;
    const link = await Url.findOne({ shortId: code });
    if (!link) return res.status(404).json({ error: "Link not found" });
    return res.json(link);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to fetch link" });
  }
};

// DELETE /api/links/:code
exports.deleteLink = async (req, res) => {
  try {
    const code = req.params.code;
    const deleted = await Url.findOneAndDelete({ shortId: code });
    if (!deleted) return res.status(404).json({ error: "Link not found" });
    return res.json({ message: "Link deleted" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Failed to delete link" });
  }
};
