import OpenAI from "openai";
import { tavily } from "@tavily/core";
import dotenv from "dotenv"
dotenv.config()
/*
   CLIENTS (LAZY INITIALIZATION)
*/

let chatClient = null;     // Groq (text chat)
let imageClient = null;    // OpenAI (image generation)

/* 
   WEB SEARCH TOOL FUNCTION
 */

async function webSearch(SearchQuery) {
  const tvlyApiKey =
    process.env.TAVILY_API_KEY || process.env.Tavily_API_KEY;

  if (!tvlyApiKey) {
    throw new Error("TAVILY_API_KEY not configured.");
  }

  const tvly = tavily({ apiKey: tvlyApiKey });
  const response = await tvly.search(SearchQuery);

  return response.results
    ?.map((result) => result.content)
    .join("\n\n") || "No results found.";
}

/* 
   TEXT CHAT FUNCTION
   (Groq Model)
 */

export async function getAssistantMessage(messages = []) {
  try {
    if (!chatClient) {
      const apiKey =
        process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;

      if (!apiKey) {
        throw new Error(
          "GROQ_API_KEY (or OPENAI_API_KEY) environment variable not set."
        );
      }

      chatClient = new OpenAI({
        apiKey,
        baseURL: "https://api.groq.com/openai/v1",
      });
    }

    const tools = [
      {
        type: "function",
        function: {
          name: "WebSearch",
          description: "Search the web for realtime information",
          parameters: {
            type: "object",
            properties: {
              SearchQuery: {
                type: "string",
                description: "Search query",
              },
            },
            required: ["SearchQuery"],
          },
        },
      },
    ];

    while (true) {
      const response = await chatClient.chat.completions.create({
        model: "openai/gpt-oss-20b",
        temperature: 0.7,
        messages,
        tools,
        tool_choice: "auto",
      });

      const message = response.choices[0].message;
      messages.push(message);

      if (!message.tool_calls) {
        return message;
      }

      for (const toolCall of message.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(
          toolCall.function.arguments || "{}"
        );

        if (toolName === "WebSearch") {
          const searchResult = await webSearch(
            toolArgs.SearchQuery
          );

          messages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: toolName,
            content: searchResult,
          });
        }
      }
    }
  } catch (error) {
    console.error("Error in getAssistantMessage:", error);
    throw error;
  }
}

/* ==============================
   IMAGE GENERATION FUNCTION
   (Using OpenAI DALL-E)
============================== */

export const generateImageFromHF = async (prompt) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable not set.");
    }

    // Use OpenAI's DALL-E API
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "b64_json",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.data || !data.data[0] || !data.data[0].b64_json) {
      throw new Error("No image data received from OpenAI");
    }

    return data.data[0].b64_json;
  } catch (error) {
    console.error("Image Generation Error:", error.message);
    throw new Error(`Failed to generate image: ${error.message}`);
  }
};