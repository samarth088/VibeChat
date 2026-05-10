// ================= DB CONNECTION =================
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,          // max 10 connections pool me
      serverSelectionTimeoutMS: 5000,  // 5s me connect nahi hua to fail
      socketTimeoutMS: 45000   // 45s idle connection timeout
    });

    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Failed");
    console.error(error.message);
    process.exit(1);
  }
};

module.exports = { connectDB };
