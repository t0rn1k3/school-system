const path = require("path");
const envPath = path.join(__dirname, ".env");
require("dotenv").config({ path: envPath });
if (!process.env.MONGO_URL) {
  console.error("MONGO_URL missing. Tried loading from:", envPath);
}
const http = require("http");
require("./config/dbConnect");
const app = require("./app/app");

const PORT = process.env.PORT || 2020;

//server
const server = http.createServer(app);

server.listen(PORT, console.log(`Server is running on port : ${PORT}`));
