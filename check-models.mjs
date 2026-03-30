import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyB8mIN12M56Nf_1ExM7NflrSj-tzr77Ypk";
const genAI = new GoogleGenerativeAI(API_KEY);

async function checkModels() {
  const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash", "gemini-2.5-flash", "gemini-pro-vision"];
  for (const m of models) {
    try {
      console.log(`Checking ${m}...`);
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent("Hi");
      const resp = await result.response;
      console.log(`✅ ${m} WORKS:`, resp.text().substring(0, 20));
      break; 
    } catch (e) {
      console.log(`❌ ${m} FAILED: ${e.message.substring(0, 50)}`);
    }
  }
}

checkModels();
