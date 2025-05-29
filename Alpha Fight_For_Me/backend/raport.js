const db = require('./database');

async function updateUserReport(userId, openai) {
  console.log("🔍 Génération du rapport pour userId :", userId);
  console.log("📊 Messages récupérés pour le rapport :");
  
  // 1. Récupérer toutes les conversations de l'utilisateur
  return new Promise((resolve, reject) => {
    db.all("SELECT message, response, timestamp FROM conversations WHERE user_id = ? ORDER BY timestamp ASC", [userId], async (err, rows) => {
      if (err) return reject(err);

      console.log("📊 Messages récupérés pour le rapport :");
      rows.forEach((r, i) => {
        console.log(`#${i + 1} - ${r.message} | ${r.timestamp}`);
      });

      // Construire un texte brut des conversations pour l'IA
      let conversationText = rows.map(r => `Message: ${r.message}\nRéponse: ${r.response}\nDate: ${r.timestamp}`).join("\n\n");

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
ces informations sois transmit de raport en raport tout en augmentant de la quantité de données perso au fur et a mesure.
Les infos perso du type : nom prénom métiers meilleurs amis mot de passe sercret ect ... mais cela doit rester court et synthetique 

Voici l'historique des conversations :\n
${conversationText}

Fournis le rapport au format texte, bien structuré et clair.
`;

      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: analysisPrompt }],
          max_tokens: 500,
        });

        const reportText = response.choices[0].message.content.trim();

        // 3. Mettre à jour la colonne report de l'utilisateur
        db.run("UPDATE users SET report = ? WHERE id = ?", [reportText, userId], (updateErr) => {
          if (updateErr) return reject(updateErr);
          resolve(reportText);
        });
      } catch (openaiErr) {
        reject(openaiErr);
      }
    });
  });
}

module.exports = { updateUserReport };

