import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./db/db"; // 1. Import the function

dotenv.config();

const app = express();

// 2. Call the connection function
connectDB(); 

const p = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Ride Sharing API is Live!");
});

app.listen(p, () => {
    console.log(`Server running on http://localhost:${p}`);
});