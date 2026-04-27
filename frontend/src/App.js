import React, { useState } from "react";
import Login from "./Login";
import Admin from "./Admin";
import User from "./User";

function App() {
  const [view, setView]         = useState("login"); // "login" | "admin" | "user"
  const [username, setUsername] = useState("");

  const handleLogin = ({ role, username: uname }) => {
    setUsername(uname);
    setView(role === "admin" ? "admin" : "user");
  };

  const handleLogout = () => {
    setUsername("");
    setView("login");
  };

  return (
    <>
      <div className="bg-mesh" />
      <div className="page-content">
        {view === "login" && (
          <Login onLogin={handleLogin} />
        )}
        {view === "admin" && (
          <Admin username={username} onLogout={handleLogout} />
        )}
        {view === "user" && (
          <User username={username} onLogout={handleLogout} />
        )}
      </div>
    </>
  );
}

export default App;