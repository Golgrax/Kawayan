import { GoogleGenAI, Type, Schema } from "@google/genai";
import { BrandProfile, ContentIdea } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const TAGLISH_SYSTEM_INSTRUCTION = `
You are an expert social media manager for Philippine MSMEs. 
Your specialty is creating "Taglish" (Tagalog-English code-switching) content that resonates deeply with local Filipinos.
You understand concepts like "hugot" (emotional pull), "diskarte" (hustle), "sweldo" (payday) humor, and Filipino pop culture.
Always ensure the tone matches the brand's voice.
When asked for JSON, return ONLY valid JSON.
`;

export const generateContentPlan = async (profile: BrandProfile, month: string): Promise<ContentIdea[]> => {
  if (!apiKey) throw new Error("API Key missing");

  const prompt = `
    Create a 7-item sample social media content calendar for ${month} for a business with these details:
    Name: ${profile.businessName}
    Industry: ${profile.industry}
    Target Audience: ${profile.targetAudience}
    Voice: ${profile.brandVoice}
    Themes: ${profile.keyThemes}

    Ensure a mix of promotional, engagement, and educational content.
    Return a list of content ideas distributed throughout the month.
  `;

  const schema: Schema = {
    type: Type.ARRAY,
    items: {
      type: Type.OBJECT,
      properties: {
        day: { type: Type.INTEGER, description: "Day of the month (1-30)" },
        title: { type: Type.STRING, description: "Short catchy title" },
        topic: { type: Type.STRING, description: "Description of the content topic" },
        format: { type: Type.STRING, enum: ['Image', 'Carousel', 'Video'] }
      },
      required: ["day", "title", "topic", "format"]
    }
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: TAGLISH_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    return JSON.parse(response.text || '[]') as ContentIdea[];
  } catch (error) {
    console.error("Error generating plan:", error);
    return [];
  }
};

export const generatePostCaptionAndImagePrompt = async (
  profile: BrandProfile,
  topic: string
): Promise<{ caption: string; imagePrompt: string; viralityScore: number; viralityReason: string }> => {
  if (!apiKey) throw new Error("API Key missing");

  const prompt = `
    Task: Write a social media post for this topic: "${topic}".
    Business: ${profile.businessName} (${profile.industry}).
    Voice: ${profile.brandVoice}.

    1. Caption: Natural, conversational Taglish. Include emojis and 3-5 hashtags.
    2. Image Prompt: Detailed English prompt for an image generator. High aesthetic.
    3. Virality Analysis: Rate from 0-100 how engaging/viral this post might be for Filipinos and explain why in one short sentence.
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      caption: { type: Type.STRING, description: "The social media caption in Taglish" },
      imagePrompt: { type: Type.STRING, description: "Detailed prompt for image generation" },
      viralityScore: { type: Type.INTEGER, description: "Score 0-100 based on engagement potential" },
      viralityReason: { type: Type.STRING, description: "Short reason why it will be effective" }
    },
    required: ["caption", "imagePrompt", "viralityScore", "viralityReason"]
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: TAGLISH_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      caption: result.caption || "Error generating caption.",
      imagePrompt: result.imagePrompt || "Error generating prompt.",
      viralityScore: result.viralityScore || 50,
      viralityReason: result.viralityReason || "Standard post."
    };
  } catch (error) {
    console.error("Error generating post:", error);
    throw error;
  }
};

export const generateImageFromPrompt = async (prompt: string): Promise<string | null> => {
  if (!apiKey) throw new Error("API Key missing");

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: [
        { text: prompt }
      ],
      config: {
        // Default configs for flash-image
      }
    });

    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
      for (const part of parts) {
        if (part.inlineData && part.inlineData.data) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    return null; 
  }
};

export const getTrendingTopicsPH = async (): Promise<string[]> => {
  if (!apiKey) return ["Sale", "Pagkain", "Sweldo"];
  
  const prompt = "List 5 generic but currently relevant trending topics, events, or seasons in the Philippines right now (e.g., Christmas, Summer, Back to School, Payday, Viral Memes). Return just the topics as a simple list.";
  
  const schema: Schema = {
    type: Type.ARRAY,
    items: { type: Type.STRING }
  };

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (e) {
    return ["Payday Sale", "Weekend", "Food Trip"];
  }
};
