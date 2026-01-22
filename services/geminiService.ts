import { BrandProfile, ContentIdea } from "../types";
import { ValidationService } from "./validationService";
import { logger } from "../utils/logger";

const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || '';

// --- LOCAL AI ENGINE (OLLAMA PROXIED) ---
// This calls the Ollama server running locally in your Codespace via the Backend Proxy.
const callLocalAI = async (prompt: string, system?: string): Promise<string> => {
  try {
    console.log("Gemini Unavailable. Switching to Local AI (Ollama - qwen2.5:7b)...");
    const response = await fetch('/api/ai/local', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'qwen2.5:7b',
        messages: [
          { role: 'system', content: system || 'You are Kawayan AI Support. Friendly, Taglish, concise.' },
          { role: 'user', content: prompt }
        ],
        stream: false,
        options: {
          temperature: 0.7,
          top_p: 0.95,
        }
      })
    });

    if (!response.ok) throw new Error("Local AI Unreachable");
    const data = await response.json();
    return data.message?.content || "";
  } catch (e) {
    console.error("Local AI failed:", e);
    return "";
  }
};

// --- STABLE GEMINI FETCH ---
const callGeminiDirect = async (prompt: string, model: string = 'gemini-1.5-flash'): Promise<string> => {
  if (!apiKey) throw new Error("API Key missing");
  // Using v1beta as the models are often not found in v1 yet
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
        response_mime_type: "application/json",
      }
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || "Gemini Error");
  }

  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
};

const TAGLISH_SYSTEM_INSTRUCTION = `
You are Kawayan AI, a helpful virtual assistant for Filipino business owners.
1. Answer the user's question directly.
2. Use a mix of English and Tagalog (Taglish).
3. Be professional but friendly.
`;

const MODELS = ['gemini-flash-latest', 'gemini-2.0-flash', 'gemini-2.5-flash'];

const generateWithFallback = async (prompt: string) => {
  let lastError;
  
  // 1. Try Gemini Models first
  for (const model of MODELS) {
    try {
      console.log(`Attempting Gemini (${model})...`);
      return await callGeminiDirect(prompt, model);
    } catch (error: any) {
      console.warn(`${model} failed:`, error.message);
      lastError = error;
    }
  }

  // 2. FALLBACK TO LOCAL AI (Ollama)
  const localRes = await callLocalAI(prompt, TAGLISH_SYSTEM_INSTRUCTION);
  if (localRes) return localRes;

  throw new Error("All AI engines exhausted");
};

export const generateContentPlan = async (profile: BrandProfile, month: string): Promise<ContentIdea[]> => {
    const prompt = `
    Analyze the following brand profile:
    - Business Name: ${profile.businessName}
    - Industry: ${profile.industry}
    - Target Audience: ${profile.targetAudience}
    - Brand Voice: ${profile.brandVoice}
    - Key Themes: ${profile.keyThemes}

    Based on this profile, create a 7-item social media content plan for the month of ${month}.
    The plan should be diverse and align with the brand's voice and goals.
    The output must be ONLY a valid JSON array of objects, where each object has the following properties: "day" (number), "title" (string), "topic" (string, a detailed and engaging post idea), and "format" (string, e.g., "Image", "Video", "Carousel").
    Ensure the topics are specific, creative, and tailored to the brand. For example, instead of "Promote product", suggest "Behind-the-scenes look at how [Product Name] is made".
    The language of the 'title' and 'topic' should be in Taglish (a mix of Tagalog and English) or Filipino, and should match the specified 'Brand Voice'.
  `;
  try {
    logger.info("Generating content plan with prompt:", prompt);
    const res = await generateWithFallback(prompt);
    logger.info("Received response from AI for content plan:", res);
    return ValidationService.validateContentIdeas(JSON.parse(res));
  } catch (e: any) {
    logger.error("Error generating content plan:", e.message);
    return ValidationService.createFallbackContentIdeas(month);
  }
};

export const generatePostCaptionAndImagePrompt = async (profile: BrandProfile, topic: string): Promise<any> => {
  const prompt = `
    As an expert social media manager for the brand "${profile.businessName}", generate a post about the topic: "${topic}".

    Adhere to the brand's identity:
    - Business Name: ${profile.businessName}
    - Industry: ${profile.industry}
    - Target Audience: ${profile.targetAudience}
    - Brand Voice: ${profile.brandVoice}
    - Key Themes: ${profile.keyThemes}

    Instructions:
    1.  **Caption:** Write a compelling, engaging, and creative social media caption in Taglish (a mix of Tagalog and English) or Filipino. It must align with the brand's voice.
    2.  **Image Prompt:** Create a detailed, descriptive English prompt for an AI image generator (like Midjourney or DALL-E) to create a visually stunning and relevant image for the post. The prompt should be specific, including details about subject, style, lighting, and composition.
    3.  **Virality Score:** Estimate a virality score from 0 to 100, where 100 is most likely to go viral.
    4.  **Virality Reason:** Briefly explain in English why you gave that score, based on factors like emotional appeal, relevance, or shareability.

    The output must be ONLY a single, valid JSON object with the following keys: "caption", "imagePrompt", "viralityScore", "viralityReason".
  `;
  try {
    logger.info("Generating post with prompt:", prompt);
    const res = await generateWithFallback(prompt);
    logger.info("Received response from AI for post:", res);
    return ValidationService.validatePostResponse(JSON.parse(res));
  } catch (e: any) {
    logger.error("Error generating post caption and image prompt:", e.message);
    return ValidationService.createFallbackPostResponse(topic);
  }
};

export const generateImageFromPrompt = async (prompt: string): Promise<string | null> => {
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1080&height=1080&nologo=true`;
};

export const getTrendingTopicsPH = async (industry?: string): Promise<string[]> => {
  const prompt = `List 5 trending topics in the Philippines for ${industry || 'general'} industry. Return ONLY a JSON string array.`;
  try {
    const res = await generateWithFallback(prompt);
    const jsonStr = res.match(/.*]/s)?.[0] || res;
    return ValidationService.validateTrendingTopics(JSON.parse(jsonStr));
  } catch (error) {
    return ValidationService.createFallbackTrendingTopics();
  }
};

export const chatWithSupportBot = async (message: string, history: {sender: 'user'|'bot', text: string}[]): Promise<string> => {
  const fullPrompt = `History:\n${history.map(h => `${h.sender}: ${h.text}`).join('\n')}\nUser: ${message}\nResponse (Taglish, concise):`;
  try {
    return await generateWithFallback(fullPrompt);
  } catch (e) {
    // FINAL REDUNDANCY: Tell user to talk to human instead of fake replies
    return "I apologize, my AI systems are currently overloaded. Please click 'New Ticket' above or use the 'Call Us' button to speak with a human agent directly!";
  }
};