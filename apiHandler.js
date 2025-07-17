const API_KEYS = {
  // anthropic: "claude-XXX" ← לא חובה כרגע
};

let currentOpenAIKeyIndex = 0;

async function askAI(userMessage, mode = "claim") {
  // ⭕ ננסה עד 3 מפתחות OpenAI:
  for (let i = 0; i < API_KEYS.openai.length; i++) {
    try {
      const key = API_KEYS.openai[currentOpenAIKeyIndex];
      const res = await fetch("", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: mode === "claim" ? "אתה כותב מכתבי תביעה בעברית." : "אתה עוזר לכתוב קורות חיים בעברית." },
            { role: "user", content: userMessage }
          ]
        })
      });

      if (res.ok) {
        const data = await res.json();
        return data.choices[0].message.content;
      } else {
        console.warn("OpenAI נכשל:", await res.text());
        currentOpenAIKeyIndex = (currentOpenAIKeyIndex + 1) % API_KEYS.openai.length;
      }
    } catch (err) {
      console.warn("OpenAI נכשל:", err);
      currentOpenAIKeyIndex = (currentOpenAIKeyIndex + 1) % API_KEYS.openai.length;
    }
  }

  // 🔁 ננסה Gemini:
  try {
    const geminiRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEYS.gemini}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: userMessage }] }] })
    });

    if (geminiRes.ok) {
      const geminiData = await geminiRes.json();
      return geminiData.candidates[0].content.parts[0].text;
    } else {
      console.warn("Gemini נכשל:", await geminiRes.text());
    }
  } catch (err) {
    console.warn("Gemini נכשל:", err);
  }

  // 🧠 ננסה את השרת המקומי:
  try {
    const local = await fetch("http://localhost:3000/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userMessage })
    });

    const localData = await local.json();
    return localData.message;
  } catch (err) {
    console.warn("❌ שרת גיבוי נכשל:", err);
    return "⚠️ כל המערכות עמוסות כרגע. נסה שוב מאוחר יותר.";
  }
}
