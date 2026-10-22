import { useState, useEffect } from "react";

const API = "http://localhost:3000";

function loadSaved() {
  try {
    const saved = JSON.parse(localStorage.getItem("auth"));
    return saved && saved.token && saved.user ? saved : null;
  } catch (err) {
    return null;
  }
}

function App() {
  const [auth, setAuth] = useState(loadSaved());
  const [page, setPage] = useState("menu");

  function handleLogin(data) {
    localStorage.setItem("auth", JSON.stringify(data));
    setAuth(data);
    setPage("menu");
  }

  function logout() {
    localStorage.removeItem("auth");
    setAuth(null);
    setPage("menu");
  }

  const isOwner = auth && auth.user.role === "owner";

  return (
    <div>
      <h1>Cloud Kitchen</h1>

      <div style={{ display: "flex", gap: "8px", justifyContent: "center", alignItems: "center" }}>
        <button onClick={() => setPage("menu")}>Menu</button>
        {isOwner && <button onClick={() => setPage("kitchen")}>Kitchen</button>}
        {auth ? (
          <>
            <span>
              Hi, {auth.user.name} ({auth.user.role})
            </span>
            <button onClick={logout}>Logout</button>
          </>
        ) : (
          <button onClick={() => setPage("login")}>Login / Register</button>
        )}
      </div>

      {page === "menu" && (
        <MenuPage auth={auth} goToLogin={() => setPage("login")} logout={logout} />
      )}
      {page === "kitchen" && isOwner && <KitchenPage auth={auth} logout={logout} />}
      {page === "login" && <AuthPage onLogin={handleLogin} />}
    </div>
  );
}

function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setError("");
    try {
      const url = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body =
        mode === "login" ? { email, password } : { name, email, password };

      const res = await fetch(API + url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Something went wrong");
        return;
      }
      onLogin(data);
    } catch (err) {
      setError("Could not reach the server. Is the backend running?");
    }
  }

  return (
    <div>
      <h2>{mode === "login" ? "Login" : "Create account"}</h2>
      <form
        onSubmit={submit}
        style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "300px", margin: "0 auto" }}
      >
        {mode === "register" && (
          <input
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}
        <input
          placeholder="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          placeholder="Password (min 6 characters)"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">{mode === "login" ? "Login" : "Register"}</button>
      </form>

      {error && <p>{error}</p>}

      <p>
        {mode === "login" ? "New here? " : "Already have an account? "}
        <button onClick={() => setMode(mode === "login" ? "register" : "login")}>
          {mode === "login" ? "Create account" : "Go to login"}
        </button>
      </p>
    </div>
  );
}

function MenuPage({ auth, goToLogin, logout }) {
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
    if (!auth) {
      goToLogin();
      return;
    }

    try {
      const res = await fetch(`${API}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({
          items: cart.map((item) => ({ id: item._id, qty: item.qty })),
        }),
      });

      if (res.status === 401) {
        setMessage("Your login expired. Please log in again.");
        logout();
        return;
      }

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
          <button onClick={placeOrder}>
            {auth ? "Place order" : "Login to place order"}
          </button>
        </div>
      )}

      {message && <h3>{message}</h3>}
    </div>
  );
}

function KitchenPage({ auth, logout }) {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState("");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${auth.token}`,
  };

  async function loadOrders() {
    try {
      const res = await fetch(`${API}/api/orders`, { headers });
      if (res.status === 401) {
        logout();
        return;
      }
      if (!res.ok) {
        const err = await res.json();
        setError(err.message);
        return;
      }
      setOrders(await res.json());
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
      headers,
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
