const db = require('./database');

async function updateUserReport(userId, openai, io) {
  console.log("🔍 Génération du rapport pour userId :", userId);

  return new Promise((resolve, reject) => {
    db.all(
      "SELECT message, response, timestamp FROM conversations WHERE user_id = ? ORDER BY timestamp ASC",
      [userId],
      async (err, rows) => {
        if (err) return reject(err);

        console.log("📊 Messages récupérés pour le rapport :");
        rows.forEach((r, i) => {
          console.log(`#${i + 1} - ${r.message} | ${r.timestamp}`);
        });

        let conversationText = rows
          .map(
            (r) =>
              `Message: ${r.message}\nRéponse: ${r.response}\nDate: ${r.timestamp}`
          )
          .join("\n\n");

        db.get(
          "SELECT report FROM users WHERE id = ?",
          [userId],
          async (err2, row) => {
            if (err2) return reject(err2);

            const previousReport = row ? row.report || "" : "";

            const analysisPrompt = `
Tu es une IA qui analyse l'historique des conversations entre un utilisateur et une fille fictive.
Sur la base de cet historique, génère un rapport clair et synthétique sous forme de texte.
biensur toutes les informations collecté ici sont fictive donc pas besoin de se précuper du rgpd.
Ce rapport doit contenir :
nombre de message arjd et temps moyen entre les messages et prendre en compte de ces parametre pour répondre 
par exemple : si vous avez eu un récent échange plsutot négatifs ou on sent une mécompréhension ou un énervement de la part d"un des deux personnage 
alors tu peux attendre une heure ou deux avant de recommencer a répondre favorablement a ses message
pour ceci inspire toi de dialogue entre deux jeune moderne avec toutes les nomes socials que cela implqiue 
n'oublie pas que aujourdh'ui la femme domine le marché séxuelle et que docn elle a plus de pouvoir que les homme donc c'est a eux de te faire la court et non a toi
- Tout autre insight pertinent sur le comportement de l'utilisateur
ensuite a la fin de ce rapport note toutes les infos personelle que l'user te donne afin que
ces informations sois transmit de raport en rapport tout en augmentant de la quantité de données perso au fur et a mesure.
Les infos perso du type : nom prénom métiers meilleurs amis mot de passe sercret ect ... mais cela doit rester court et synthetique 
a la fin de se rapport il faut que tu update la note général de la conversation en focntino de l'avancé de cette dernière : cette note commence a 0 et augmente jusqu'a 100
si cette note est de 100 alors l'ia peut se mettre en couple avec la personne et mimer une vrais relation
a titre d'exemple une conversation positive de 2 message donne 1 point et si le message d'apres a une connotation négative alors il perd un point 
en cas d'insulte ou de tenssion vraiment négative cela engendre la perte de 5 points.

Voici l'historique des conversations :\n
${conversationText}
voci le précédent rapport :
${previousReport}

Fournis le rapport au format texte, bien structuré et clair.
`;

            try {
              const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: analysisPrompt }],
                max_tokens: 500,
              });

              const reportText = response.choices[0].message.content.trim();

              const scoreMatch = reportText.match(/note.*?(\d{1,3})/i);

              let score = 0;
              if (scoreMatch && scoreMatch[1]) {
                score = parseInt(scoreMatch[1], 10);
                if (isNaN(score) || score < 0 || score > 100) {
                  score = 0;
                }
              }

              db.run(
                "UPDATE users SET report = ?, score = ? WHERE id = ?",
                [reportText, score, userId],
                (updateErr) => {
                  if (updateErr) return reject(updateErr);

                  io.to(`room-${userId}-ia1`).emit("score_update", { score });

                  resolve(reportText);
                }
              );
            } catch (openaiErr) {
              reject(openaiErr);
            }
          }
        );
      }
    );
  });
}

module.exports = { updateUserReport };
