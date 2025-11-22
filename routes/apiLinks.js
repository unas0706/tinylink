const express = require("express");
const router = express.Router();
const controller = require("../controllers/apiLinksController");

router.post("/", controller.createLink);
router.get("/", controller.listLinks);
router.get("/:code", controller.getLink);
router.delete("/:code", controller.deleteLink);

module.exports = router;
