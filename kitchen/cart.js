const menu = [
  { id: 1, name: "Biryani", price: 220, veg: false },
  { id: 2, name: "Dosa", price: 80, veg: true },
  { id: 3, name: "Paneer Butter Masala", price: 180, veg: true },
];

const names = menu.map((dish) => dish.name);
console.log(names);

const dish = menu.find((d) => d.id === 2);
console.log(dish);

const cart = [
  { dishId: 1, quantity: 2 },
  { dishId: 3, quantity: 1 },
];

const billLines = cart.map((item) => {
  const d = menu.find((m) => m.id === item.dishId);
  return {
    name: d.name,
    quantity: item.quantity,
    lineTotal: d.price * item.quantity,
  };
});
console.log(billLines);

const grandTotal = billLines.reduce((sum, line) => sum + line.lineTotal, 0);
console.log("Grand total: ₹" + grandTotal);

function getTotal(cart) {
  return cart.reduce((sum, item) => {
    const d = menu.find((m) => m.id === item.dishId);
    return sum + d.price * item.quantity;
  }, 0);
}

function addToCart(cart, dishId) {
  const existing = cart.find((item) => item.dishId === dishId);

  if (existing) {
    existing.quantity = existing.quantity + 1;
  } else {
    cart.push({ dishId: dishId, quantity: 1 });
  }
}

function removeFromCart(cart, dishId) {
  const index = cart.findIndex((item) => item.dishId === dishId);

  if (index === -1) {
    return;
  }

  if (cart[index].quantity > 1) {
    cart[index].quantity = cart[index].quantity - 1;
  } else {
    cart.splice(index, 1);
  }
}
// ===== Tests =====
addToCart(cart, 2);
addToCart(cart, 2);
console.log(cart);
console.log(getTotal(cart)); // 780

removeFromCart(cart, 1);
console.log(cart);
removeFromCart(cart, 1);
console.log(cart);
console.log(getTotal(cart)); // 340
