const mongoose = require("mongoose");
const dbConnect = async () => {
  try {
    // console.log(process.env);
    await mongoose.connect(process.env.MONGO_URL);
    console.log("DB Connected Successfully");
  } catch (error) {
    console.log("DB Conectio Failed", error.message);
  }
};

dbConnect();
