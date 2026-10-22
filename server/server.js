import dns from "node:dns";
dns.setServers(["8.8.8.8", "1.1.1.1"]);

import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

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
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
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

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["customer", "owner"], default: "customer" },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

function makeToken(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
}

function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role };
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Login required" });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

function requireOwner(req, res, next) {
  if (req.user.role !== "owner") {
    return res.status(403).json({ message: "Owner access only" });
  }
  next();
}

app.get("/", (req, res) => {
  res.send("Cloud Kitchen API is running");
});

app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || typeof password !== "string" || password.length < 6) {
    return res.status(400).json({
      message:
        "name, email and a password of at least 6 characters are required",
    });
  }

  const cleanEmail = String(email).toLowerCase().trim();

  const existing = await User.findOne({ email: cleanEmail });
  if (existing) {
    return res.status(409).json({ message: "Email already registered" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const role =
    process.env.OWNER_EMAIL &&
    cleanEmail === process.env.OWNER_EMAIL.toLowerCase().trim()
      ? "owner"
      : "customer";

  const user = await User.create({
    name,
    email: cleanEmail,
    passwordHash,
    role,
  });

  res.status(201).json({ token: makeToken(user), user: publicUser(user) });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || typeof password !== "string") {
    return res.status(400).json({ message: "email and password are required" });
  }

  const user = await User.findOne({
    email: String(email).toLowerCase().trim(),
  });
  const ok = user && (await bcrypt.compare(password, user.passwordHash));
  if (!ok) {
    return res.status(401).json({ message: "Wrong email or password" });
  }

  res.json({ token: makeToken(user), user: publicUser(user) });
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

app.post("/api/menu", requireAuth, requireOwner, async (req, res) => {
  const { name, price, veg } = req.body;

  if (!name || typeof price !== "number") {
    return res
      .status(400)
      .json({ message: "name and a numeric price are required" });
  }

  const newDish = await MenuItem.create({ name, price, veg: Boolean(veg) });
  res.status(201).json(newDish);
});

app.delete("/api/menu/:id", requireAuth, requireOwner, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid id" });
  }

  const deleted = await MenuItem.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return res.status(404).json({ message: "Dish not found" });
  }

  res.json({ message: "Dish deleted" });
});

app.post("/api/orders", requireAuth, async (req, res) => {
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
      return res
        .status(400)
        .json({
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
  const order = await Order.create({
    user: req.user.id,
    items: orderItems,
    total,
  });
  res.status(201).json(order);
});

app.get("/api/orders", requireAuth, requireOwner, async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 });
  res.json(orders);
});

app.patch(
  "/api/orders/:id/status",
  requireAuth,
  requireOwner,
  async (req, res) => {
    const allowed = ["placed", "preparing", "ready"];
    const { status } = req.body;

    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ message: "Invalid id" });
    }
    if (!allowed.includes(status)) {
      return res
        .status(400)
        .json({ message: "status must be placed, preparing or ready" });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { returnDocument: "after" },
    );
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  },
);

async function start() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is missing in server/.env");
  }

  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB");

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

start();
