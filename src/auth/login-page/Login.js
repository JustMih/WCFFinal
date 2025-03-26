import React, { useState, useEffect } from "react";
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
  const [timeRemaining, setTimeRemaining] = useState(null);

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

       console.log(data); // Debugging log to check backend response

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
         if (data.timeRemaining) {
           setTimeRemaining(data.timeRemaining); // Set remaining lockout time
         }
       }
     } catch (err) {
       setError("Network error. Please try again.");
     }
     setIsLoading(false);
   };

   useEffect(() => {
     // If timeRemaining is set, start a countdown
     if (timeRemaining !== null) {
       const interval = setInterval(() => {
         setTimeRemaining((prevTime) => prevTime - 1000);
       }, 1000);

       return () => clearInterval(interval);
     }
   }, [timeRemaining]);

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
            {timeRemaining !== null && timeRemaining > 0 && (
              <p className="lockout-timer">
                You can try again in {Math.ceil(timeRemaining / 1000)} seconds.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
