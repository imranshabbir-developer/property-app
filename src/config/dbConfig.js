import mongoose from "mongoose";
import dotenv from "dotenv";
import colors from 'colors'


dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected Successfully..!`.bgBlue);
  } catch (error) {
    console.error("Database Connection Error:", error.message);
    process.exit(1);
  }
};

export default connectDB;
