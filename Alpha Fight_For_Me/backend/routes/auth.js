const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../database");
const router = express.Router();

// Inscription
router.post("/register", async (req, res) => {
  const { username, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);

  db.run(
    "INSERT INTO users (username, password) VALUES (?, ?)",
    [username, hashed],
    function (err) {
      if (err) {
        return res.status(400).json({ message: "Utilisateur déjà existant" });
      }
      res.status(201).json({ message: "Inscription réussie" });
    }
  );
});

// Connexion
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get("SELECT * FROM users WHERE username = ?", [username], async (err, user) => {
    if (err || !user) {
      return res.status(400).json({ message: "Utilisateur introuvable" });
    }
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Mot de passe incorrect" });
    }

    // Stocke les infos utilisateur dans la session
    req.session.user = {
      username: user.username,
      role: user.role,
      id: user.id
    };

    res.status(200).json({
      message: "Connexion réussie",
      username: user.username,
      role: user.role
    });
  });
});

module.exports = router;
