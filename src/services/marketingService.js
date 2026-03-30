import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabase } from '../lib/supabase';
import debugLogger from '../utils/debugLogger';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const NANO_MACHINE_API = import.meta.env.VITE_NANO_MACHINE_API;

const genAI = new GoogleGenerativeAI(API_KEY);

export const marketingService = {
  /**
   * Verifica se o restaurante ainda tem créditos para geração hoje
   */
  async checkDailyLimit(restauranteId) {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('geracoes_marketing')
      .select('quantidade_dia')
      .eq('restaurante_id', restauranteId)
      .eq('data_geracao', today)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    const count = data ? data.quantidade_dia : 0;
    return {
      allowed: count < 5,
      remaining: 5 - count,
      count
    };
  },

  /**
   * Incrementa o contador de gerações diárias
   */
  async incrementDailyLimit(restauranteId) {
    const today = new Date().toISOString().split('T')[0];
    
    const { data: existing } = await supabase
      .from('geracoes_marketing')
      .select('id, quantidade_dia')
      .eq('restaurante_id', restauranteId)
      .eq('data_geracao', today)
      .single();

    if (existing) {
      await supabase
        .from('geracoes_marketing')
        .update({ 
          quantidade_dia: existing.quantidade_dia + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', existing.id);
    } else {
      await supabase
        .from('geracoes_marketing')
        .insert({
          restaurante_id: restauranteId,
          data_geracao: today,
          quantidade_dia: 1
        });
    }
  },

  /**
   * Converte arquivo para GenerativePart para o Gemini
   */
  async fileToGenerativePart(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve({
          inlineData: {
            data: reader.result.split(',')[1],
            mimeType: file.type
          },
        });
      };
      reader.readAsDataURL(file);
    });
  },

  /**
   * Envia para a nova API Nano Machine do Google Studio
   */
  async generateNanoMachineArt(imageFile, style, aspectRatio = "1:1") {
    debugLogger.info('NANO-MACHINE', 'Conectando ao motor Nano Machine...', { style, aspectRatio });
    
    const generativePart = await this.fileToGenerativePart(imageFile);
    const base64 = generativePart.inlineData.data;

    try {
      const response = await fetch(NANO_MACHINE_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: imageFile.type,
          style: style, 
          aspectRatio: aspectRatio
        })
      });

      // 🚨 DEBUG: Ler texto puro primeiro conforme sugestão do Google Studio
      const rawText = await response.text();
      debugLogger.debug('NANO-MACHINE', 'Resposta Bruta recebida', { rawText: rawText.substring(0, 100) + '...' });

      if (!response.ok) {
        throw new Error(`Motor Nano Machine respondeu: ${response.status}. Detalhes no console.`);
      }

      // Tentar converter para JSON
      let data;
      try {
        data = JSON.parse(rawText);
      } catch (jsonError) {
        debugLogger.error('NANO-MACHINE', 'Resposta não é JSON válido', { rawText });
        throw new Error("O servidor devolveu HTML em vez de imagem. Verifique se o app está atualizado no Google Studio clicando em 'Share' novamente.");
      }

      debugLogger.success('NANO-MACHINE', 'Arte gerada com sucesso!', { analysis: data.analysis });
      return data; 
    } catch (error) {
      debugLogger.error('NANO-MACHINE', 'Erro na conexão', { error: error.message });
      throw error;
    }
  },

  /**
   * Gera o material de marketing usando IA
   */
  async generateMarketing(restauranteId, imageFile, style, aspectRatio = "1:1") {
    const limitStatus = await this.checkDailyLimit(restauranteId);
    if (!limitStatus.allowed) {
      throw new Error("Limite diário de 5 gerações atingido.");
    }

    const nanoResult = await this.generateNanoMachineArt(imageFile, style, aspectRatio);
    
    if (!nanoResult?.generatedUrl) {
      throw new Error("Nano Machine falhou ao gerar a URL.");
    }

    debugLogger.info('GEMINI', 'Gerando copy de vendas...');
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const imagePart = await this.fileToGenerativePart(imageFile);

    const prompt = `
      Você é o "Nano Banana Copywriter". 
      Analise este produto e a seguinte análise técnica da imagem: "${nanoResult.analysis}".
      Crie: 
      1. "nome_sugerido": Comercial e curto.
      2. "texto_whatsapp": Focado em conversão.
      3. "texto_banner": Curto e impactante.
      FORMATO JSON.
    `;

    const copyResult = await model.generateContent([prompt, imagePart]);
    const copyResponse = await copyResult.response;
    const copyText = copyResponse.text();
    
    let content;
    try {
      const jsonMatch = copyText.match(/\{[\s\S]*\}/);
      content = JSON.parse(jsonMatch ? jsonMatch[0] : copyText);
    } catch (e) {
      content = { 
        nome_sugerido: "Produto Ninja", 
        texto_whatsapp: "Confira nossa novidade!", 
        texto_banner: "Peça Agora!" 
      };
    }

    const { data: material, error: saveError } = await supabase
      .from('materiais_marketing')
      .insert({
        restaurante_id: restauranteId,
        nome_sugerido: content.nome_sugerido,
        texto_whatsapp: content.texto_whatsapp,
        texto_banner: content.texto_banner,
        objetivo: style,
        imagem_processada_url: nanoResult.generatedUrl,
      })
      .select()
      .single();

    if (saveError) debugLogger.error('SUPABASE', 'Erro ao salvar', saveError);

    await this.incrementDailyLimit(restauranteId);

    return {
      ...content,
      id: material?.id,
      imagem_processada_url: nanoResult.generatedUrl,
      analysis: nanoResult.analysis
    };
  },

  async getHistory(restauranteId) {
    const { data, error } = await supabase
      .from('materiais_marketing')
      .select('*')
      .eq('restaurante_id', restauranteId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async requestHighlight(materialId) {
    const { error } = await supabase
      .from('materiais_marketing')
      .update({ solicitado_destaque: true })
      .eq('id', materialId);

    if (error) throw error;
    return true;
  }
};
