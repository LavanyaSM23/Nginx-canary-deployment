import React, { useState } from "react";
import Login from "./Login";
import Admin from "./Admin";
import User from "./User";

function App() {
  const [view, setView] = useState("login"); // "login" | "admin" | "user"

  if (view === "login") {
    return <Login onLogin={(role) => setView(role)} />;
  }
  
  if (view === "admin") {
    return <Admin onLogout={() => setView("login")} />;
  }

  return <User onLogout={() => setView("login")} />;
}

export default App;
