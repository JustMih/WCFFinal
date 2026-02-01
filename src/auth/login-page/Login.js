import React, { useState, useEffect } from "react";
import { ImSpinner9 } from "react-icons/im";
import wcf_image from "../../asserts/images/wcf_image.jpg";
import wcf_logo from "../../asserts/images/logo.png";
import loginBg1 from "../../asserts/bg/bg4.PNG";
import loginBg2 from "../../asserts/bg/bg1.PNG";
import loginBg3 from "../../asserts/bg/bg2.PNG";
import loginBg4 from "../../asserts/bg/bg3.PNG";
import loginBg5 from "../../asserts/bg/bg5.PNG";
import loginBg6 from "../../asserts/bg/bg6.PNG"
import { TextField, Button } from "@mui/material";
import { baseURL } from "../../config";
import { storeDomainCredentials, storeCredentialsObject, validateCredentials } from "../../utils/credentials";
import "./login.css";

export default function Login() {
  const [username, setUsername] = useState(""); // Changed email to username
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(null);
  
  // Background images array for slideshow
  const backgroundImages = [loginBg1, loginBg2, loginBg3, loginBg4, loginBg5, loginBg6];
  const [currentBgIndex, setCurrentBgIndex] = useState(0);

  const handleLogin = async (e) => {
    setIsLoading(true);
    e.preventDefault();

    const loginData = { username, password }; // Send username instead of email

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
        const tokenExpiration = new Date().getTime() + 3600 * 1000; // 1 hour

        // Core user session (localStorage for persistence)
        localStorage.setItem("authToken", token);
        localStorage.setItem("username", data.user.full_name);
        localStorage.setItem("role", data.user.role);
        localStorage.setItem("unit_section", data.user.unit_section);
        localStorage.setItem("tokenExpiration", tokenExpiration);
        localStorage.setItem("userId", data.user.id);
        localStorage.setItem("agentStatus", "ready");

        // SIP Extension support (localStorage for persistence)
        const extension = data.user.extension || "";
        localStorage.setItem("extension", extension);

        // Set sipPassword only if user has an extension
        if (extension) {
          localStorage.setItem("sipPassword", "sip12345");
        } else {
          localStorage.setItem("sipPassword", "");
        }

        // Store domain credentials securely in sessionStorage
        if (data.credentials && validateCredentials(data.credentials)) {
          // Use the new secure method for storing credentials object
          storeCredentialsObject(data.credentials);
          console.log("Domain credentials stored securely in sessionStorage");
        } else if (data.credentials) {
          // Fallback for legacy format
          storeDomainCredentials(data.credentials.username, data.credentials.password);
          console.log("Domain credentials stored securely in sessionStorage (legacy method)");
        }

        // Redirect to dashboard based on user role
        // Supervisors go to /dashboard-old, others go to /dashboard
        const userRole = data.user.role;
        if (userRole === "supervisor") {
          window.location.href = "/dashboard-old";
        } else {
          window.location.href = "/dashboard";
        }
      } else {
        setError(data.message || "An error occurred. Please try again.");
        if (data.timeRemaining) {
          setTimeRemaining(data.timeRemaining); // Lockout time
        }
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }

    setIsLoading(false);
  };

  useEffect(() => {
    if (timeRemaining !== null) {
      const interval = setInterval(() => {
        setTimeRemaining((prevTime) => prevTime - 1000);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timeRemaining]);

  // Background slideshow effect
  useEffect(() => {
    const slideshowInterval = setInterval(() => {
      setCurrentBgIndex((prevIndex) => (prevIndex + 1) % backgroundImages.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(slideshowInterval);
  }, [backgroundImages.length]);

  return (
    <div className="login-container">
      {/* Background slideshow layers */}
      {backgroundImages.map((bg, index) => (
        <div
          key={index}
          className={`login-bg-slide ${index === currentBgIndex ? 'active' : ''}`}
          style={{ backgroundImage: `url(${bg})` }}
        />
      ))}
      <div className="login-card">
        {/* Left Content Section */}
        <div className="login-image">
          <div className="content-overlay">
            <div className="slogan">
              <span className="slogan-our">Contact</span> <span className="slogan-slogan">Center</span>
            </div>
            {/* <p className="content-paragraph">
            Rightful Compensation, On Time.
            </p> */}
            <div className="support-info">
              <div className="support-item">
                <span className="support-label">For Support contact IT SUPPORT</span>
              </div>
              <div className="support-item">
                <span className="support-label">Email:</span>
                <span className="support-value">support@wcf.go.tz</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Login Form Section */}
        <div className="login-form">
          <div className="form-container">
            <div className="logo">
              <img src={wcf_logo} alt="logo" className="wcf-logo" />
            </div>
    
            {/* <h2 className="login-heading">LOGIN</h2> */}
            
            <form onSubmit={handleLogin}>
              <div className="form-field">
                <TextField
                  label="Username"
                  variant="outlined"
                  fullWidth
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              
              <div className="form-field">
                <TextField
                  label="Password"
                  type="password"
                  variant="outlined"
                  fullWidth
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              
              <Button type="submit" className="login-button">
                {isLoading ? (
                  <>
                    <ImSpinner9 style={{ marginRight: 5 }} />
                    waiting...
                  </>
                ) : (
                  "LOGIN"
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
    </div>
  );
}
