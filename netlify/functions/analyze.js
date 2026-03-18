export async function handler(event) {
  try {
    // Cerchiamo entrambe le varianti della chiave per sicurezza
    const API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Chiave API mancante nelle impostazioni di Netlify" }),
      };
    }

    const { text } = JSON.parse(event.body || "{}");

    // Usiamo il modello 'flash', che è più stabile e veloce per gli account gratuiti
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: text || "Analizza questo messaggio" }] }],
      }),
    });

    const data = await response.json();

    // Gestione degli errori provenienti direttamente da Google
    if (data.error) {
      console.error("Errore Google API:", data.error);
      return {
        statusCode: data.error.code || 500,
        body: JSON.stringify({ error: data.error.message }),
      };
    }

    // Se tutto va bene, restituiamo i dati
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    };

  } catch (error) {
    console.error("Errore interno funzione:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Errore del server: " + error.message }),
    };
  }
}
