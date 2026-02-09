const mongoose = require("mongoose");

const dbConnect = async () => {
  try {
    if (!process.env.MONGO_URL) {
      throw new Error("MONGO_URL is not defined in environment variables");
    }

    // Connection options for better reliability
    const options = {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds instead of 30
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    };

    await mongoose.connect(process.env.MONGO_URL, options);
    console.log("DB Connected Successfully");

    // Handle connection events
    mongoose.connection.on("error", (err) => {
      console.error("MongoDB connection error:", err);
    });

    mongoose.connection.on("disconnected", () => {
      console.warn("MongoDB disconnected");
    });

    mongoose.connection.on("reconnected", () => {
      console.log("MongoDB reconnected");
    });
  } catch (error) {
    console.error("DB Connection Failed:", error.message);

    // Provide helpful error messages for common issues
    if (error.message.includes("whitelist") || error.message.includes("IP")) {
      console.error("\n⚠️  IP Whitelist Issue Detected!");
      console.error("To fix this:");
      console.error("1. Go to MongoDB Atlas Dashboard");
      console.error("2. Navigate to: Network Access → IP Access List");
      console.error("3. Click 'Add IP Address'");
      console.error(
        "4. Click 'Add Current IP Address' or add 0.0.0.0/0 for all IPs (development only)",
      );
      console.error("5. Wait a few minutes for changes to propagate");
      console.error(
        "\n⚠️  Note: Using 0.0.0.0/0 allows access from any IP (not recommended for production)",
      );
    }

    // Don't exit in development, but log clearly
    // Uncomment the line below if you want the server to exit on DB connection failure
    // process.exit(1);
  }
};

dbConnect();
