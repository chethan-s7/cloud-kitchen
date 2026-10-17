import express from "express";

const app = express();
const PORT = 3000;

app.use(express.json());

const menu = [
  { id: 1, name: "Biryani", price: 220, veg: false },
  { id: 2, name: "Dosa", price: 80, veg: true },
  { id: 3, name: "Paneer Butter Masala", price: 180, veg: true },
];
let nextId = 4;

app.get("/", (req, res) => {
  res.send("Cloud Kitchen API is running");
});

app.get("/api/menu", (req, res) => {
  res.json(menu);
});

app.get("/api/menu/:id", (req, res) => {
  const id = Number(req.params.id);
  const dish = menu.find((d) => d.id === id);

  if (!dish) {
    return res.status(404).json({ message: "Dish not found" });
  }

  res.json(dish);
});

app.post("/api/menu", (req, res) => {
  const { name, price, veg } = req.body;

  if (!name || typeof price !== "number") {
    return res
      .status(400)
      .json({ message: "name and a numeric price are required" });
  }

  const newDish = {
    id: nextId,
    name: name,
    price: price,
    veg: Boolean(veg),
  };
  nextId = nextId + 1;

  menu.push(newDish);
  res.status(201).json(newDish);
});

app.delete("/api/menu/:id", (req, res) => {
  const id = Number(req.params.id);
  const index = menu.findIndex((d) => d.id === id);

  if (index === -1) {
    return res.status(404).json({ message: "Dish not found" });
  }

  menu.splice(index, 1);
  res.json({ message: "Dish deleted" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
