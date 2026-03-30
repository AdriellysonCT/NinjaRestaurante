import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyB8mIN12M56Nf_1ExM7NflrSj-tzr77Ypk";
const genAI = new GoogleGenerativeAI(API_KEY);

async function listModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`);
    const data = await response.json();
    console.log("Modelos Disponíveis:", JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Erro ao listar modelos:", error);
  }
}

listModels();
