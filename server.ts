import express from "express";
import { createServer } from "http";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

const server = createServer(app);

// Initialize Gemini
const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// API Route for PDF Import
app.post("/api/import-pdf", async (req, res) => {
  const { text, userId } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Texto não fornecido" });
  }

  try {
    const response = await genAI.models.generateContent({
      model: "gemini-3-flash-preview",
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
                  name: { type: Type.STRING },
                  phone: { type: Type.STRING },
                  address: { type: Type.STRING },
                  notes: { type: Type.STRING }
                },
                required: ["name", "phone"]
              },
              loan: {
                type: Type.OBJECT,
                properties: {
                  capital: { type: Type.NUMBER },
                  interest_rate: { type: Type.NUMBER },
                  payment_type: { type: Type.STRING, description: "DAILY, WEEKLY or MONTHLY" },
                  installments_count: { type: Type.NUMBER },
                  start_date: { type: Type.STRING, description: "YYYY-MM-DD" }
                },
                required: ["capital", "interest_rate", "payment_type", "installments_count", "start_date"]
              }
            }
          }
        }
      }
    });

    const extractedData = JSON.parse(response.text || '[]');

    if (extractedData.length === 0) {
      return res.status(400).json({ error: "Nenhum dado extraído" });
    }

    // Mock implementation since Supabase is removed
    console.log("Extracted Data:", extractedData);
    
    res.json({ success: true, count: extractedData.length });

  } catch (error: any) {
    console.error("Import error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Vite middleware
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, "dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "dist", "index.html"));
  });
}

server.listen(3000, "0.0.0.0", () => {
  console.log("Server running on http://localhost:3000");
});
