import React, { useState } from "react";
import { ImSpinner9 } from "react-icons/im";
import wcf_image from "../../asserts/images/wcf_image.jpg";
import wcf_logo from "../../asserts/images/logo.png";
import { TextField, Button } from "@mui/material";
import { baseURL } from "../../config";
import "./login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    setIsLoading(true);
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
        const token = data.token;
        const tokenExpiration = new Date().getTime() + 3600 * 1000; // Token expires in 1 hour (3600 seconds)

        localStorage.setItem("authToken", token);
        localStorage.setItem("username", data.user.name);
        localStorage.setItem("role", data.user.role);
        localStorage.setItem("tokenExpiration", tokenExpiration); // Save expiration time
        localStorage.setItem("userId", data.user.id);
        window.location.href = "/dashboard";
      } else {
        setError(data.message || "An error occurred. Please try again.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
    setIsLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-image">
          <img src={wcf_image} alt="login" className="wcf-image" />
        </div>
        <div className="login-form">
          <form onSubmit={handleLogin}>
            <div className="logo">
              <img src={wcf_logo} alt="logo" className="wcf-logo" />
            </div>
            <TextField
              label="Email"
              variant="outlined"
              fullWidth
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <TextField
              label="Password"
              type="password"
              variant="outlined"
              fullWidth
              margin="normal"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" className="login-button">
              {isLoading ? (
                <>
                  <ImSpinner9 style={{ marginRight: 5 }} />
                  waiting...
                </>
              ) : (
                "Login"
              )}
            </Button>
            {error && <p className="error">{error}</p>}
          </form>
        </div>
      </div>
    </div>
  );
}
