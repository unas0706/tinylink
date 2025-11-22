// const Url = require("../models/Url");
// const { nanoid } = require("nanoid");
// const dotenv = require("dotenv");
// dotenv.config();

// exports.createShortUrl = async (req, res) => {
//   try {
//     const { longUrl, customAlias } = req.body;

//     if (!longUrl) return res.status(400).json({ msg: "URL is required" });

//     let shortIdExists;
//     if (customAlias) {
//       shortIdExists = await Url.findOne({ shortId: customAlias });
//       if (shortIdExists) {
//         return res.status(400).json({ error: "Custom alias already in use" });
//       }
//     }
//     let shortId;

//     if (customAlias) {
//       // user-defined
//       shortId = customAlias;
//     } else {
//       // nanoid default
//       shortId = nanoid(6);
//     }

//     const newUrl = await Url.create({ longUrl, shortId });

//     return res.json({
//       shortUrl: `${process.env.
//         BASE_URL}/${shortId}`,
//     });
//   } catch (error) {
//     return res.status(500).json({ error: error.message });
//   }
// };

// exports.redirectUrl = async (req, res) => {
//   try {
//     const shortId = req.params.shortId;

//     const urlData = await Url.findOne({ shortId });

//     if (!urlData) return res.status(404).json({ msg: "URL not found" });

//     urlData.clicks++;
//     await urlData.save();

//     return res.redirect(urlData.longUrl);
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// };

const Url = require("../models/Url");
const { nanoid } = require("nanoid");

exports.createShortUrl = async (req, res) => {
  try {
    const { longUrl } = req.body;

    if (!longUrl) {
      return res.render("index", {
        urls: [],
        error: "URL is required",
      });
    }

    // Validate URL format and scheme for SSR submissions
    try {
      const parsed = new URL(longUrl);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        return res.render("index", {
          urls: [],
          error: "Invalid URL scheme (must be http or https)",
        });
      }
    } catch (err) {
      return res.render("index", { urls: [], error: "Invalid URL format" });
    }

    const shortId = nanoid(6);

    const newUrl = await Url.create({
      longUrl,
      shortId,
    });

    const urls = await Url.find().sort({ createdAt: -1 });

    return res.render("index", {
      urls,
      success: `Short URL created: ${process.env.BASE_URL}/${shortId}`,
    });
  } catch (error) {
    return res.render("index", {
      urls: [],
      error: error.message,
    });
  }
};

exports.redirectUrl = async (req, res) => {
  try {
    const shortId = req.params.shortId;
    const urlData = await Url.findOne({ shortId });

    if (!urlData) {
      return res.status(404).send("URL not found");
    }

    urlData.clicks++;
    urlData.lastClicked = new Date();
    await urlData.save();

    return res.redirect(urlData.longUrl);
  } catch (error) {
    res.status(500).send(error.message);
  }
};
