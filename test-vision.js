import { GoogleGenerativeAI } from "@google/generative-ai";
import fetch from "node-fetch";

// Chave fornecida pelo usuário
const API_KEY = "AIzaSyB8mIN12M56Nf_1ExM7NflrSj-tzr77Ypk";
const genAI = new GoogleGenerativeAI(API_KEY);

async function testVision() {
  console.log("🚀 Iniciando teste de Visão do Gemini...");
  
  try {
    // 1. Pegar uma imagem aleatória de teste
    console.log("📸 Buscando imagem de teste...");
    const response = await fetch("https://picsum.photos/200/300");
    const buffer = await response.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');

    // 2. Testar o modelo de visão (Experimentar modelos diferentes)
    const modelsToTest = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro-vision"];
    
    for (const modelName of modelsToTest) {
      console.log(`\n--- Testando Modelo: ${modelName} ---`);
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const prompt = "O que você vê nesta imagem? Descreva brevemente.";
        
        const result = await model.generateContent([
          prompt,
          {
            inlineData: {
              data: base64Image,
              mimeType: "image/jpeg"
            }
          }
        ]);
        
        const res = await result.response;
        console.log(`✅ Sucesso (${modelName}):`, res.text());
        break; // Se um funcionar, paramos
      } catch (err) {
        console.error(`❌ Erro no modelo ${modelName}:`, err.message);
        if (err.message.includes("429")) {
          console.error("DICA: Este erro 429 indica que você esgotou a quota de testes grátis no momento.");
        }
      }
    }
  } catch (error) {
    console.error("💥 Erro geral no script de teste:", error);
  }
}

testVision();
