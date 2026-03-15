const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const http = require("http");
require("./config/dbConnect");
const app = require("./app/app");

const PORT = process.env.PORT || 2020;

//server
const server = http.createServer(app);

server.listen(PORT, console.log(`Server is running on port : ${PORT}`));
