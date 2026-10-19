import { useState, useEffect } from "react";

const API = "http://localhost:3000";

function App() {
  const [page, setPage] = useState("menu");

  return (
    <div>
      <h1>Cloud Kitchen</h1>
      <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
        <button onClick={() => setPage("menu")}>Menu</button>
        <button onClick={() => setPage("kitchen")}>Kitchen</button>
      </div>

      {page === "menu" ? <MenuPage /> : <KitchenPage />}
    </div>
  );
}

function MenuPage() {
  const [menu, setMenu] = useState([]);
  const [cart, setCart] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`${API}/api/menu`)
      .then((res) => res.json())
      .then((data) => setMenu(data));
  }, []);

  function addToCart(dish) {
    setMessage("");
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

  async function placeOrder() {
    try {
      const res = await fetch(`${API}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((item) => ({ id: item._id, qty: item.qty })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessage("Order failed: " + err.message);
        return;
      }

      const order = await res.json();
      setMessage(`Order placed! Total: ₹${order.total}. Order id: ${order._id}`);
      setCart([]);
    } catch (error) {
      setMessage("Could not reach the server. Is the backend running?");
    }
  }

  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  return (
    <div>
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
          <button onClick={placeOrder}>Place order</button>
        </div>
      )}

      {message && <h3>{message}</h3>}
    </div>
  );
}

function KitchenPage() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  async function loadOrders() {
    try {
      const res = await fetch(`${API}/api/orders`);
      const data = await res.json();
      setOrders(data);
      setError("");
    } catch (err) {
      setError("Could not load orders. Is the backend running?");
    }
  }

  useEffect(() => {
    loadOrders();
    const timer = setInterval(loadOrders, 5000);
    return () => clearInterval(timer);
  }, []);

  async function changeStatus(id, status) {
    await fetch(`${API}/api/orders/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    loadOrders();
  }

  return (
    <div>
      <h2>Kitchen orders</h2>
      {error && <p>{error}</p>}
      {orders.length === 0 && !error && <p>No orders yet.</p>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", justifyContent: "center" }}>
        {orders.map((order) => (
          <div
            key={order._id}
            style={{ border: "1px solid #555", borderRadius: "8px", padding: "16px", width: "260px" }}
          >
            <h3>Status: {order.status}</h3>
            {order.items.map((item) => (
              <p key={item._id}>
                {item.name} × {item.qty}
              </p>
            ))}
            <p>
              <b>Total: ₹{order.total}</b>
            </p>
            <p style={{ fontSize: "12px" }}>
              {new Date(order.createdAt).toLocaleString()}
            </p>
            <div style={{ display: "flex", gap: "6px", justifyContent: "center" }}>
              <button onClick={() => changeStatus(order._id, "placed")}>Placed</button>
              <button onClick={() => changeStatus(order._id, "preparing")}>Preparing</button>
              <button onClick={() => changeStatus(order._id, "ready")}>Ready</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;