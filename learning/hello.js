const customerName = "Chethan";
let orderCount = 0;

function placeOrder(dish, price) {
  orderCount = orderCount + 1;
  console.log(`${customerName} ordered ${dish} for ₹${price}`);
  console.log(`Total orders so far: ${orderCount}`);
}

placeOrder("Biryani", 220);
placeOrder("Dosa", 80);
const menu = [
  { name: "Biryani", price: 220, veg: false },
  { name: "Dosa", price: 80, veg: true },
  { name: "Paneer Butter Masala", price: 180, veg: true },
];
const vegDishes = menu.filter((dish) => dish.veg === true);
console.log(vegDishes);
const total = menu.reduce((sum, dish) => sum + dish.price, 0);
console.log(total);
