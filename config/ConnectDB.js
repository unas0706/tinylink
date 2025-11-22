const { default: mongoose } = require("mongoose");

exports.ConnectDB = () => {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("MongoDB Connected");
    })
    .catch((err) => console.log(err));
};
