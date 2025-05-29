const db = require("./database");

function saveConversation(userId, message, response) {
  console.log("saveConversation called with userId:", userId);
  const stmt = db.prepare(`
    INSERT INTO conversations (user_id, message, response)
    VALUES (?, ?, ?)
  `);
  stmt.run(userId, message, response, (err) => {
    if (err) console.error("Erreur d'enregistrement :", err);
    else console.log("Conversation sauvegardée.");
  });
}

module.exports = { saveConversation };
