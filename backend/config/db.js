const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/malayalamithram";

async function connectDB(retries = 5, delay = 5000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const conn = await mongoose.connect(MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        heartbeatFrequencyMS: 30000,
      });
      console.log(`\n MongoDB connected: ${conn.connection.host}`);
      return conn;
    } catch (err) {
      console.error(` MongoDB connection attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt === retries) {
        console.error(" All MongoDB connection attempts failed. Server will keep retrying...");
        return null;
      }
      await new Promise((r) => setTimeout(r, delay));
    }
  }
}

module.exports = connectDB;
