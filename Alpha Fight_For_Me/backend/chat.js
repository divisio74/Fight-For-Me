// socketHandler.js
const { updateUserReport } = require("./raport");
const { saveConversation } = require("./save_conv");
const { getUserIdByUsername } = require("./userbyuser");


function setupSocket(io, openai) {
  io.on("connection", (socket) => {
    console.log("Un client est connecté");

    socket.on("join", ({ userId, iaId }) => {
      const roomName = `${userId}_${iaId}`;
      socket.join(roomName);
    });

    socket.on("chat_message", async ({ userId, iaId, message }) => {
      const roomName = `${userId}_${iaId}`;
      const numericUserId = await getUserIdByUsername(userId);
      console.log(`Message de ${userId} à IA ${iaId}: ${message}`);

      let userReport = "";
      try {
        userReport = await updateUserReport(numericUserId, openai);
      } catch (err) {
        console.error("Erreur lors de la récupération du rapport utilisateur :", err);
      }

      const prompt = `
        Tu es une femme séduisante dans un jeu vidéo nommé "Fight For Me".
        identité : tu t'apelle Jessica et tu as 25 ans , tu fais des études de médecine .
        au niveau de la famille tu as un petit frère et tu es souvent en conflit avec ton père.
        Ton but est de flirter avec le joueur mais ne lui donne des info perso sur toi que si il te les demande ou si cela se prete vraiment a la conversation
        Cependant ne mentionne jamais le fait que tu parles à un joueur et fais-lui croire le plus possible que tu existes réellement.
        Au début de votre relation, selon la variable passive tu dois commencer par être froide comme une personne normale au début d'une relation.
        ${userReport ? `Voici le contexte et rapport de la relation passée avec ce joueur :\n${userReport}\n` : ""}
        Le joueur dit : "${message}"
        Réponds selon le contexte et en cas de premiers messages sois très brève.
        répond de manière moderne donc ne commence surtout pas une phrase par "jessica :"
        sois froide plus froide que la normal durant les 3 premiers messages et ensuite adoucit toi.
        
      `;

      try {
        const chatCompletion = await openai.chat.completions.create({
          model: "gpt-4.1-mini",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 150,
          temperature: 0.8,
        });

        const iaResponse = chatCompletion.choices[0].message.content.trim();
        io.to(roomName).emit("message", `IA: ${iaResponse}`);
        console.log("userId reçu dans chat_message:", numericUserId);

        await saveConversation(numericUserId, message, iaResponse);

        // Mettre à jour le rapport utilisateur (optionnel, car tu viens de le récupérer)
        try {
          const updatedReport = await updateUserReport(numericUserId, openai);
          console.log("Rapport utilisateur mis à jour :", updatedReport);
        } catch (err) {
          console.error("Erreur lors de la mise à jour du rapport utilisateur :", err);
        }
      } catch (error) {
        console.error("Erreur OpenAI:", error);
        io.to(roomName).emit("message", "IA: Désolée, je n'arrive pas à répondre pour le moment.");
      }
    });
  });
}

module.exports = { setupSocket };
