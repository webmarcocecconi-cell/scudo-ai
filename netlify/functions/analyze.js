export async function handler(event) {
  // Log per capire cosa arriva dal tuo sito (lo vedrai nei log di Netlify)
  console.log("Dati ricevuti dal frontend:", event.body);

  try {
    const API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

    if (!API_KEY) {
      console.error("ERRORE: API Key non trovata su Netlify");
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Configurazione incompleta: manca la chiave API" }),
      };
    }

    const body = JSON.parse(event.body || "{}");
    const textToAnalyze = body.text || "Messaggio di test";

    // Cambiamo l'URL a v1beta (più permissivo per le API Key)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: textToAnalyze }] }],
      }),
    });

    const data = await response.json();

    // Se Google risponde con un errore (es. 404, 400, 403)
    if (!response.ok || data.error) {
      console.error("Errore dettagliato da Google:", data.error);
      return {
        statusCode: response.status || 500,
        body: JSON.stringify({ 
          error: data.error?.message || "Errore sconosciuto da Google API",
          status: response.status
        }),
      };
    }

    // Risposta corretta
    return {
      statusCode: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*" 
      },
      body: JSON.stringify(data),
    };

  } catch (error) {
    console.error("Errore critico nella funzione:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Errore interno del server: " + error.message }),
    };
  }
} 
