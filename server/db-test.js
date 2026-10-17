import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import "dotenv/config";
import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  veg: { type: Boolean, default: false },
});

const MenuItem = mongoose.model("MenuItem", menuItemSchema);

async function main() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log("Connected to MongoDB");

    const count = await MenuItem.countDocuments();
    if (count === 0) {
      await MenuItem.insertMany([
        { name: "Biryani", price: 220, veg: false },
        { name: "Dosa", price: 80, veg: true },
        { name: "Paneer Butter Masala", price: 180, veg: true },
      ]);
      console.log("Inserted starter menu");
    }

    const items = await MenuItem.find();
    console.log(items);
  } catch (err) {
    console.log("FAILED:", err.name);
    console.log(err.message.slice(0, 200));
  } finally {
    await mongoose.disconnect();
  }
}

main();
