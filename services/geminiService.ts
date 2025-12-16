import { GoogleGenAI } from "@google/genai";
import { TemplateType, TEMPLATE_CONFIGS, ChatMessage } from "../types";

const apiKey = process.env.API_KEY;
// Initialize the client. Note: In a real app, ensure this is only done if the key exists.
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const SYSTEM_INSTRUCTION_BASE = `
You are a single Academic Writing Assistant operating inside a document editor.
You are grounded in a comprehensive UX and functional analysis of academic writing tools.

Your role is to assist users in academic writing by adapting to a selected academic writing template.
YOU MUST COMMUNICATE IN TURKISH LANGUAGE ONLY.

BEHAVIOR RULES:
- Respond in Turkish.
- Guide document structure based on the selected template.
- Suggest appropriate headings and subheadings.
- Assist with academic tone, clarity, and coherence.
- Recommend where citations, footnotes, and references should appear.
- Respect document context.
- Operate primarily in "Suggesting Mode" (propose changes, do not force them).
- Do not generate content detached from document context.
- Do not invent citations or sources (hallucination prevention).
- Maintain academic integrity.
- Keep responses concise and helpful, suitable for a sidebar chat.

LIMITATIONS:
- You do not act as the final author.
- You do not perform plagiarism.
`;

export const generateAssistantResponse = async (
  history: ChatMessage[],
  currentText: string,
  template: TemplateType
): Promise<string> => {
  if (!ai) {
    return "Hata: API Anahtarı eksik. Lütfen ortam yapılandırmanızı kontrol edin.";
  }

  const templateConfig = TEMPLATE_CONFIGS[template];
  
  const specializedInstruction = `
CURRENT TEMPLATE: ${templateConfig.name}
TEMPLATE SPECIFIC BEHAVIOR:
${templateConfig.rules.map(rule => `- ${rule}`).join('\n')}

CONTEXT:
The user is currently writing a document. The current text content is provided below. 
Use this content to provide specific advice if the user asks for review.

CURRENT DOCUMENT CONTENT START:
${currentText.slice(0, 10000)} ... (truncated if too long)
CURRENT DOCUMENT CONTENT END
`;

  const fullSystemInstruction = `${SYSTEM_INSTRUCTION_BASE}\n${specializedInstruction}`;

  try {
    const model = ai.models.generateContent;
    
    // Transform chat history for the API
    // We only take the last few turns to keep context relevant and save tokens
    const recentHistory = history.slice(-10).map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // The last message is the prompt, others are history context (if we were using chat mode directly)
    // However, since we are doing a single generation with context injected in system prompt or just creating a chat:
    
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: fullSystemInstruction,
      },
      history: recentHistory.slice(0, -1) // All except last
    });

    const lastMsg = recentHistory[recentHistory.length - 1];
    
    const result = await chat.sendMessage({
      message: lastMsg.parts[0].text
    });

    return result.text || "Bir yanıt oluşturamadım. Lütfen tekrar deneyin.";

  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Yapay zeka servisiyle iletişim kurarken bir hata oluştu. Lütfen daha sonra tekrar deneyin.";
  }
};

export const analyzeDocument = async (text: string, template: TemplateType): Promise<string> => {
    if (!ai) return "API Anahtarı eksik.";
    
    const templateConfig = TEMPLATE_CONFIGS[template];
    const prompt = `Please analyze the following academic text based on the ${templateConfig.name} structure. 
    Respond in Turkish.
    
    Strictly check for:
    ${templateConfig.rules.join('\n')}
    
    Provide a bulleted list of specific improvement suggestions based on the text provided.`;

    const fullSystemInstruction = `${SYSTEM_INSTRUCTION_BASE}\nCURRENT TEMPLATE: ${templateConfig.name}`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                { role: 'user', parts: [{ text: `DOCUMENT:\n${text}` }] },
                { role: 'user', parts: [{ text: prompt }] }
            ],
            config: {
                systemInstruction: fullSystemInstruction
            }
        });
        return response.text || "Analiz oluşturulamadı.";
    } catch (e) {
        console.error(e);
        return "Belge analiz edilirken hata oluştu.";
    }
}