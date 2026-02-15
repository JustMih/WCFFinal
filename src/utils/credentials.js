// Utility functions for managing domain credentials securely with AES encryption

// Import crypto-js for AES encryption
import CryptoJS from 'crypto-js';

// Secret key for encryption (in production, this should come from environment variables)
const SECRET_KEY = process.env.REACT_APP_CRYPTO_KEY || 'wcf-secure-key-2024';

// Encrypt data using AES
export const encryptData = (data) => {
  try {
    return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString();
  } catch (error) {
    console.error('Encryption failed:', error);
    return null;
  }
};

// Decrypt data using AES
export const decryptData = (ciphertext) => {
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, SECRET_KEY);
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8);
    return JSON.parse(decryptedData);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
};

// Legacy functions for backward compatibility (using Base64)
export const encryptPassword = (password) => {
  return btoa(password); // Base64 encoding
};

export const decryptPassword = (encrypted) => {
  return atob(encrypted); // Base64 decoding
};

// Get domain credentials from sessionStorage (new secure method)
export const getDomainCredentials = () => {
  const encrypted = sessionStorage.getItem("domainCredentials");
  
  if (!encrypted) {
    // Fallback to legacy method for backward compatibility
    const username = sessionStorage.getItem("domainUsername");
    const encryptedPassword = sessionStorage.getItem("domainPassword");
    
    if (!username || !encryptedPassword) {
      return null;
    }
    
    return {
      username,
      password: decryptPassword(encryptedPassword)
    };
  }
  
  return decryptData(encrypted);
};

// Store domain credentials in sessionStorage (new secure method)
export const storeDomainCredentials = (username, password) => {
  const credentials = { username, password };
  const encrypted = encryptData(credentials);
  
  if (encrypted) {
    // Store encrypted credentials
    sessionStorage.setItem("domainCredentials", encrypted);
    
    // Clear legacy storage
    sessionStorage.removeItem("domainUsername");
    sessionStorage.removeItem("domainPassword");
  } else {
    // Fallback to legacy method
    sessionStorage.setItem("domainUsername", username);
    sessionStorage.setItem("domainPassword", encryptPassword(password));
  }
};

// Store credentials object (for when backend returns credentials object)
export const storeCredentialsObject = (credentials) => {
  if (credentials && credentials.username && credentials.password) {
    storeDomainCredentials(credentials.username, credentials.password);
  }
};

// Clear domain credentials from sessionStorage
export const clearDomainCredentials = () => {
  sessionStorage.removeItem("domainCredentials");
  sessionStorage.removeItem("domainUsername");
  sessionStorage.removeItem("domainPassword");
};

// Check if domain credentials exist
export const hasDomainCredentials = () => {
  return !!(sessionStorage.getItem("domainCredentials") || 
           (sessionStorage.getItem("domainUsername") && sessionStorage.getItem("domainPassword")));
};

// Function to authenticate with another system using stored credentials
export const authenticateWithOtherSystem = async (systemEndpoint, additionalData = {}) => {
  const credentials = getDomainCredentials();
  
  if (!credentials) {
    throw new Error('No credentials found. Please login again.');
  }
  
  try {
    const response = await fetch(systemEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}` // Include JWT token
      },
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password,
        ...additionalData
      })
    });

    if (!response.ok) {
      throw new Error(`Authentication failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Cross-system authentication failed:', error);
    throw error;
  }
};

// Function for MAC login (redirect to MAC system)
export const performMACLogin = async (macLoginEndpoint = '/mac-login') => {
  const credentials = getDomainCredentials();
  
  if (!credentials) {
    throw new Error('No credentials found. Please login again.');
  }
  
  try {
    const response = await fetch(macLoginEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({
        username: credentials.username,
        password: credentials.password
      })
    });

    const result = await response.json();
    
    if (result.redirectUrl) {
      window.location.href = result.redirectUrl;
      return result;
    } else {
      throw new Error('No redirect URL received from MAC login');
    }
  } catch (error) {
    console.error('MAC login failed:', error);
    throw error;
  }
};

// Validate credentials format
export const validateCredentials = (credentials) => {
  return credentials && 
         typeof credentials.username === 'string' && 
         typeof credentials.password === 'string' &&
         credentials.username.trim() !== '' &&
         credentials.password.trim() !== '';
}; 