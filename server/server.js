import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

const menuItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  veg: { type: Boolean, default: false },
});

const MenuItem = mongoose.model("MenuItem", menuItemSchema);

const orderSchema = new mongoose.Schema(
  {
    items: [
      {
        menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem" },
        name: String,
        price: Number,
        qty: Number,
      },
    ],
    total: { type: Number, required: true },
    status: { type: String, default: "placed" },
  },
  { timestamps: true },
);

const Order = mongoose.model("Order", orderSchema);

app.get("/", (req, res) => {
  res.send("Cloud Kitchen API is running");
});

app.get("/api/menu", async (req, res) => {
  const filter = req.query.veg === "true" ? { veg: true } : {};
  const items = await MenuItem.find(filter);
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

app.post("/api/orders", async (req, res) => {
  const { items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: "items must be a non-empty array" });
  }

  for (const item of items) {
    if (
      !mongoose.isValidObjectId(item.id) ||
      !Number.isInteger(item.qty) ||
      item.qty < 1
    ) {
      return res.status(400).json({
        message: "Each item needs a valid id and a whole qty of 1 or more",
      });
    }
  }

  const ids = items.map((item) => item.id);
  const dishes = await MenuItem.find({ _id: { $in: ids } });

  const orderItems = [];
  for (const item of items) {
    const dish = dishes.find((d) => d._id.toString() === item.id);
    if (!dish) {
      return res.status(400).json({ message: `Dish not found: ${item.id}` });
    }
    orderItems.push({
      menuItem: dish._id,
      name: dish.name,
      price: dish.price,
      qty: item.qty,
    });
  }

  const total = orderItems.reduce((sum, i) => sum + i.price * i.qty, 0);
  const order = await Order.create({ items: orderItems, total });
  res.status(201).json(order);
});

app.get("/api/orders", async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders);
});

async function start() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
