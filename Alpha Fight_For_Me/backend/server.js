require('dotenv').config();
const express = require("express");
const authRoutes = require("./routes/auth");
const session = require('express-session');
const bcrypt = require("bcrypt");
const db = require('./database');
const http = require("http");
const socketIo = require("socket.io");
const path = require("path");
const fs = require('fs');
const { OpenAI } = require("openai");
const { updateUserReport } = require('./raport');
const { setupSocket } = require("./chat");
const { saveConversation } = require("./save_conv");



const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Session setup
app.use(session({
  secret: process.env.SESSION_SECRET || 'supersecret',
  resave: false,
  saveUninitialized: false,
}));

// Middlewares
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', "frontend")));

// Auth middlewares
function isAuthenticated(req, res, next) {
  if (req.session && req.session.user) return next();
  return res.status(401).send("Non authentifié");
}

function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === "admin") return next();
  return res.status(403).send("Accès refusé");
}

app.use("/api/auth", authRoutes);


// Routes HTML
app.get("/chat", isAuthenticated, (req, res) => {
  res.sendFile(path.join(__dirname, '..', "frontend", "chat.html"));
});

app.get("/admin", isAuthenticated, isAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, '..', "frontend", "admin.html"));
});

// API admin - conversations filtrées
app.get("/api/admin/conversations", isAuthenticated, isAdmin, (req, res) => {
  const { user, fromDate, toDate } = req.query;

  let query = `
    SELECT conversations.id, users.username, conversations.message, conversations.response, conversations.timestamp
    FROM conversations
    LEFT JOIN users ON conversations.user_id = users.id
    WHERE 1=1
  `;
  const params = [];

  if (user) {
    query += " AND users.username LIKE ?";
    params.push(`%${user}%`);
  }
  if (fromDate) {
    query += " AND datetime(conversations.timestamp) >= datetime(?)";
    params.push(fromDate);
  }
  if (toDate) {
    query += " AND datetime(conversations.timestamp) <= datetime(?)";
    params.push(toDate);
  }

  query += " ORDER BY conversations.timestamp DESC";

  db.all(query, params, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Socket.io
setupSocket(io, openai);

// Serveur
const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Serveur démarré sur http://localhost:${PORT}`);
});

