import React, { useState } from "react";
import baseURL from "../../config"
import logo from "../../image/wcf_logo.png"
import "./login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Login logic in React (frontend)
  const handleSubmit = async (e) => {
    e.preventDefault();

    const loginData = { email, password };

    try {
      const response = await fetch("http://localhost:5010/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (response.ok) {
        // On successful login, save the token and username in localStorage
        localStorage.setItem("authToken", data.token);
        localStorage.setItem("username", data.user.name);
        localStorage.setItem("role", data.user.role);
        // Redirect to the dashboard or main page
        window.location.href = "/";
      } else {
        // Handle errors (wrong credentials or expired session)
        setError(data.message || "An error occurred. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
  };

  return (
    <div className="login">
      <div className="login-box">
        {/* <h1 className="title">Login</h1> */}
        <img src={logo} alt="avatar" className="logo" />
        <form onSubmit={handleSubmit}>
          <div className="textbox">
            <input
              className="input-field"
              type="text"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="textbox">
            <input
              className="input-field"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="error">{error}</p>}
          <input type="submit" className="btn" value="Login" />
        </form>
      </div>
    </div>
  );
}
