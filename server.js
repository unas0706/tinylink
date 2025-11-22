const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

const urlRoutes = require("./routes/urlRoutes");
const apiLinks = require("./routes/apiLinks");
const healthRoutes = require("./routes/health");
const { ConnectDB } = require("./config/ConnectDB");

dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

// Set EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Static folder
app.use(express.static("public"));

// Parse URL-encoded bodies (form submits)
app.use(express.urlencoded({ extended: true }));

// Ensure views always have `error` and `success` defined to avoid ReferenceError
app.use((req, res, next) => {
  res.locals.error = null;
  res.locals.success = null;
  next();
});

// Mount API and health endpoints before the generic URL redirect router
app.use("/api/links", apiLinks);
app.use("/healthz", healthRoutes);
app.use("/", urlRoutes);

ConnectDB();

app.listen(process.env.PORT, () =>
  console.log(`Server running on port ${process.env.PORT}`)
);
