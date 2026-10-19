import { useState, useEffect } from "react";

function App() {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/api/menu")
      .then((res) => res.json())
      .then((data) => setMenu(data));
  }, []);

  function addToCart(dish) {
    const existing = cart.find((item) => item._id === dish._id);
    if (existing) {
      setCart(
        cart.map((item) =>
          item._id === dish._id ? { ...item, qty: item.qty + 1 } : item
        )
      );
    } else {
      setCart([...cart, { ...dish, qty: 1 }]);
    }
  }

  function removeFromCart(id) {
    setCart(cart.filter((item) => item._id !== id));
  }

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div>
      <h1>Cloud Kitchen</h1>
      <p>Fresh food, made in one kitchen, delivered to you.</p>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", justifyContent: "center" }}>
        {menu.map((dish) => (
          <div
            key={dish._id}
            style={{ border: "1px solid #555", borderRadius: "8px", padding: "16px", width: "200px" }}
          >
            <h3>{dish.name}</h3>
            <p>{dish.veg ? "🟢 Veg" : "🔴 Non-veg"}</p>
            <p>₹{dish.price}</p>
            <button onClick={() => addToCart(dish)}>Add to cart</button>
          </div>
        ))}
      </div>

      <h2>Your cart ({totalItems} items)</h2>
      {cart.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div>
          {cart.map((item) => (
            <p key={item._id}>
              {item.name} × {item.qty} = ₹{item.price * item.qty}{" "}
              <button onClick={() => removeFromCart(item._id)}>Remove</button>
            </p>
          ))}
          <h3>Total: ₹{totalPrice}</h3>
        </div>
      )}
    </div>
  );
}

export default App;