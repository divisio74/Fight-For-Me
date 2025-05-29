const db = require("./backend/database"); // ta config sqlite3

const query = `
  SELECT conversations.id, conversations.user_id, users.id AS user_table_id, users.username
  FROM conversations
  LEFT JOIN users ON conversations.user_id = users.id
  ORDER BY conversations.timestamp DESC
`;

db.all(query, [], (err, rows) => {
  if (err) {
    console.error("Erreur lors de la requête :", err.message);
    return;
  }
  console.log("Résultats de la requête :");
  rows.forEach(row => {
    console.log(row);
  });
  db.close();
});
