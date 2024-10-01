import mongoose from "mongoose";
import dotenv from 'dotenv';

dotenv.config();

const mongoDbConnectionString = process.env.MONGO_URL;

const connectDB = async () => {
    try{
       const connection = await mongoose.connect(mongoDbConnectionString);
       console.log('Connected to MongoDB');
    }
    catch(error){
        console.log(error)
    }
}

export default connectDB;