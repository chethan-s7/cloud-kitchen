import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import "dotenv/config";
import express from "express";
import mongoose from "mongoose";

const app = express();
const PORT = 3000;

app.use(express.json());

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  veg: { type: Boolean, default: false },
});

const MenuItem = mongoose.model("MenuItem", menuItemSchema);

app.get("/", (req, res) => {
  res.send("Cloud Kitchen API is running");
});

app.get("/api/menu", async (req, res) => {
  const items = await MenuItem.find();
  res.json(items);
});

app.get("/api/menu/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid id" });
  }

  const dish = await MenuItem.findById(req.params.id);
  if (!dish) {
    return res.status(404).json({ message: "Dish not found" });
  }

  res.json(dish);
});

app.post("/api/menu", async (req, res) => {
  const { name, price, veg } = req.body;

  if (!name || typeof price !== "number") {
    return res
      .status(400)
      .json({ message: "name and a numeric price are required" });
  }

  const newDish = await MenuItem.create({ name, price, veg: Boolean(veg) });
  res.status(201).json(newDish);
});

app.delete("/api/menu/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid id" });
  }

  const deleted = await MenuItem.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "Dish not found" });
  }

  res.json({ message: "Dish deleted" });
});

async function start() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
