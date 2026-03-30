import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyB8mIN12M56Nf_1ExM7NflrSj-tzr77Ypk";
const genAI = new GoogleGenerativeAI(API_KEY);

async function testVision() {
  console.log("🚀 Iniciando teste de Visão do Gemini...");
  
  try {
    // 1. Pegar uma imagem aleatória de teste usando o fetch nativo do Node 18+
    console.log("📸 Buscando imagem de teste...");
    const response = await fetch("https://picsum.photos/200/300");
    const arrayBuffer = await response.arrayBuffer();
    const base64Image = Buffer.from(arrayBuffer).toString('base64');

    // 2. Testar o modelo de visão
    const modelName = "gemini-1.5-flash"; // Modelo padrão recomendado
    console.log(`\n--- Testando Modelo: ${modelName} ---`);
    
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

  } catch (error) {
    console.error("💥 Erro detalhado no teste:", {
      message: error.message,
      status: error.status,
      details: error.details
    });
  }
}

testVision();
