/**
 * PM2 ecosystem: loads .env then starts the app with env vars.
 * Usage: pm2 start ecosystem.config.cjs
 */
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

module.exports = {
  apps: [
    {
      name: "school-system",
      script: "server.js",
      cwd: __dirname,
      env: { ...process.env },
    },
  ],
};
