import mongoose from "mongoose";
import { config } from "dotenv";
config();

export async function connectDb() {
    try {
        const db = await mongoose.connect(process.env.DATABASE_URL);
        console.log("Connect to db", db.connection.name)
    } catch (error) {
        console.error(error)
    }
}