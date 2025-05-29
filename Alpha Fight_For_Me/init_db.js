const bcrypt = require("bcrypt");
const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("backend/db.sqlite");

const username = "admin";
const password = "Saucisse74"; // Mot de passe admin
const role = "admin";


// Création des tables si elles n'existent pas
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT,
      report TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS conversations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      message TEXT,
      response TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )
  `);

  // Hash du mot de passe et insertion admin
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) throw err;

    db.run(
      "INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)",
      [username, hash, role],
      function (err) {
        if (err) {
          console.error("❌ Erreur :", err.message);
        } else {
          console.log("✅ Utilisateur admin ajouté !");
        }
        db.close();
      }
    );
  });
});



