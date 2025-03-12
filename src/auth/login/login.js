import React, { useState } from "react";
import { baseURL } from "../../config";
import logo from "../../image/wcf_logo.png";
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
      const response = await fetch(`${baseURL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(loginData),
      });

      const data = await response.json();

      if (response.ok) {
        // On successful login, save the token, username, and expiration time in localStorage
        const token = data.token;
        const tokenExpiration = new Date().getTime() + 3600 * 1000; // Token expires in 1 hour (3600 seconds)

        localStorage.setItem("authToken", token);
        localStorage.setItem("username", data.user.name);
        localStorage.setItem("role", data.user.role);
        localStorage.setItem("userId", data.user.userId);
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

  // Automatically log out the user if the token is expired
  React.useEffect(() => {
    const checkTokenExpiration = () => {
      const tokenExpiration = localStorage.getItem("tokenExpiration");
      const currentTime = new Date().getTime();

      if (tokenExpiration && currentTime > tokenExpiration) {
        // Token has expired
        localStorage.removeItem("authToken");
        localStorage.removeItem("username");
        localStorage.removeItem("role");
        localStorage.removeItem("tokenExpiration");

        // Redirect to login page
        window.location.href = "/login";
      }
    };

    // Check token expiration every minute
    const intervalId = setInterval(checkTokenExpiration, 60000);

    return () => clearInterval(intervalId); // Cleanup the interval when the component is unmounted
  }, []);

  return (
    <div className="login">
      <div className="login-box">
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
