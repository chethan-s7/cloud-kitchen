import { useState, useEffect } from "react";

function App() {
  const [menu, setMenu] = useState([]);

  useEffect(() => {
    fetch("http://localhost:3000/api/menu")
      .then((res) => res.json())
      .then((data) => setMenu(data));
  }, []);

  return (
    <div>
      <h1>Cloud Kitchen</h1>
      <p>Fresh food, made in one kitchen, delivered to you.</p>

      {menu.map((dish) => (
        <div key={dish._id}>
          <h3>{dish.name}</h3>
          <p>₹{dish.price}</p>
        </div>
      ))}
    </div>
  );
}

export default App;