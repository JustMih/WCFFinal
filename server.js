const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const sequelize = require("./config/mysql_connection.js");
const { registerSuperAdmin } = require("./controllers/auth/authController");
const recordingRoutes = require('./routes/recordingRoutes');
const agentMetricsRoutes = require('./routes/agentMetricsRoutes');
const missedCallRoutes = require('./routes/missedCallRoutes');
const ChatMassage = require("./models/chart_message")
const { Server } = require("socket.io");
const http = require("http");
const { router: agentMetricsRouter, initializeDatabase } = require('./src/api/agentMetrics');
const mysql = require('mysql2/promise');
const RealTimeMonitoringServer = require('./server/realTimeMonitoringServer');

dotenv.config();
const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  origin: ["https://localhost:3000", "https://10.52.0.19:3000"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"]
}));

// Routes
app.use("/api", require("./routes/ivr-dtmf-routes"));
app.use('/api', recordingRoutes);
app.use('/api/agent-metrics', agentMetricsRoutes);
app.use('/api/missed-calls', missedCallRoutes);
 
// Replace existing static file config with:
app.use("/sounds", express.static("/var/lib/asterisk/sounds", {
  setHeaders: (res, path) => {
    if (path.endsWith('.wav')) {
      res.set('Content-Type', 'audio/wav');
    }
  }
}));

// Create HTTP Server & WebSocket Server
const server = http.createServer(app);
const io = new Server(server, {});

// Initialize Real-Time Monitoring Server
const realTimeMonitoringServer = new RealTimeMonitoringServer(server);

const users = {}; 

io.on("connection", (socket) => {
  console.log("New user connected:", socket.id);

  // Store user ID with their socket
  socket.on("register", (userId) => {
    users[userId] = socket.id;
    console.log(`User ${userId} connected with socket ${socket.id}`);
  });

  // Private messaging (agent -> supervisor)
  socket.on("private_message", async ({ senderId, receiverId, message }) => {
    console.log(`Message from ${senderId} to ${receiverId}: ${message}`);

    // Save message to MySQL
    await ChatMassage.create({
      senderId,
      receiverId,
      message,
    });

    // Send message to the recipient if online
    if (users[receiverId]) {
      io.to(users[receiverId]).emit("private_message", {
        senderId,
        receiverId,
        message,
      });
    } else {
      console.warn(`User ${receiverId} is offline, message not delivered.`);
    }

    // Also send the message back to the sender to update their UI
    if (users[senderId]) {
      io.to(users[senderId]).emit("private_message", {
        senderId,
        receiverId,
        message,
      });
    }
  });

  // Handle user disconnect
  socket.on("disconnect", () => {
    Object.keys(users).forEach((key) => {
      if (users[key] === socket.id) {
        console.log(`User ${key} disconnected`);
        delete users[key];
      }
    });
  });
});

// Database connection
const createDatabaseConnection = async () => {
  try {
    const connection = await mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'call_center_db',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    });

    // Initialize the agent metrics module with the database connection
    initializeDatabase(connection);

    console.log('Database connection established successfully');
    return connection;
  } catch (error) {
    console.error('Error connecting to the database:', error);
    process.exit(1);
  }
};

// Initialize database connection
createDatabaseConnection();

// Routes
app.use('/api/agent-metrics', agentMetricsRouter);

// Start the server and sync database
sequelize.sync({ force: false, alter: false }).then(() => {
  console.log("Database synced");
  registerSuperAdmin(); // Ensure Super Admin is created at startup
  
  const PORT = process.env.PORT || 5070;
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log('Real-time monitoring server initialized');
  });
}).catch(error => {
  console.error("Database sync failed:", error);
  process.exit(1);
});

 