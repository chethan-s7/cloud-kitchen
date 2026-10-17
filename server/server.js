import express from "express";

const app = express();
const PORT = 3000;

const menu = [
  { id: 1, name: "Biryani", price: 220, veg: false },
  { id: 2, name: "Dosa", price: 80, veg: true },
  { id: 3, name: "Paneer Butter Masala", price: 180, veg: true },
];

app.get("/", (req, res) => {
  res.send("Cloud Kitchen API is running");
});

app.get("/api/menu", (req, res) => {
  res.json(menu);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
