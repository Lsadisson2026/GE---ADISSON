import { GoogleGenAI, Type } from "@google/genai";

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "Texto não fornecido" });

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Extraia os dados de clientes e empréstimos do seguinte texto de PDF de cobrança.
      Retorne uma lista de objetos contendo informações do cliente (nome, telefone, endereço) e seus respectivos empréstimos (capital, taxa de juros, tipo de pagamento, número de parcelas, data de início).

      Texto:
      ${text}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              client: {
                type: Type.OBJECT,
                properties: {
                  name:    { type: Type.STRING },
                  phone:   { type: Type.STRING },
                  address: { type: Type.STRING },
                  notes:   { type: Type.STRING },
                },
                required: ["name", "phone"],
              },
              loan: {
                type: Type.OBJECT,
                properties: {
                  capital:            { type: Type.NUMBER },
                  interest_rate:      { type: Type.NUMBER },
                  payment_type:       { type: Type.STRING, description: "DAILY, WEEKLY or MONTHLY" },
                  installments_count: { type: Type.NUMBER },
                  start_date:         { type: Type.STRING, description: "YYYY-MM-DD" },
                },
                required: ["capital", "interest_rate", "payment_type", "installments_count", "start_date"],
              },
            },
          },
        },
      },
    });

    const extractedData = JSON.parse(response.text || "[]");
    if (extractedData.length === 0) {
      return res.status(400).json({ error: "Nenhum dado extraído" });
    }

    res.json({ success: true, count: extractedData.length, data: extractedData });
  } catch (error: any) {
    console.error("Import error:", error);
    res.status(500).json({ error: error.message });
  }
}
