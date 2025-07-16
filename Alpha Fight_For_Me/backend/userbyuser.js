const db = require("./database");


function getUserIdByUsername(username) {
  return new Promise((resolve, reject) => {
    db.get("SELECT id FROM users WHERE username = ?", [username], (err, row) => {
      if (err) reject(err);
      else if (!row) reject(new Error(`Utilisateur "${username}" non trouvé`));
      else resolve(row.id);
    });
  });
}

module.exports = { getUserIdByUsername };