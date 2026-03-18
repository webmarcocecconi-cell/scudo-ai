exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Chiave API mancante. Configura GEMINI_API_KEY su Netlify.' }) 
    };
  }

  let body;
  try { 
    body = JSON.parse(event.body); 
  } catch(e) { 
    return { statusCode: 400, body: JSON.stringify({ error: 'Richiesta non valida: ' + e.message }) }; 
  }

  const { type, text, imageBase64, imageType, extra } = body;

  const systemPrompt = `Sei un esperto di cybersicurezza specializzato nel rilevamento di truffe digitali (scam, phishing, smishing, vishing). Analizza il contenuto e rispondi ESCLUSIVAMENTE con JSON puro, nessun markdown, nessun backtick:
{"riskPercent":<intero 0-100>,"signals":"<ul><li>...</li></ul>","advice":"<ul><li>...</li></ul>","nextSteps":"<ul><li>...</li></ul>"}
Sii preciso e specifico. Linguaggio semplice per non esperti. Rispondi in italiano.`;

  let parts;
  if (type === 'text') {
    parts = [{ text: systemPrompt + '\n\nAnalizza questo contenuto per possibili truffe:\n\n"' + text + '"' }];
  } else {
    parts = [
      { inlineData: { mimeType: imageType, data: imageBase64 } },
      { text: systemPrompt + '\n\nAnalizza questa immagine per truffe o phishing.' + (extra ? ' Nota: ' + extra : '') }
    ];
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }] })
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Errore Gemini API: ' + responseText })
      };
    }

    const data = JSON.parse(responseText);
    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    
    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch(e) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Risposta AI non valida: ' + clean.substring(0, 200) })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Errore di rete: ' + err.message })
    };
  }
};
