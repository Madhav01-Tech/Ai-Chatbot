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
        temperature: 0.5,
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

/*
   IMAGE GENERATION FUNCTION*/
 

export const generateImageFromFreepik = async (prompt) => {
  const apiKey = process.env.FREEPIK_API_KEY;

  const response = await fetch(
    "https://api.freepik.com/v1/ai/text-to-image/flux-dev",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-freepik-api-key": apiKey,
      },
      body: JSON.stringify({
        prompt,
        aspect_ratio: "square_1_1",
      }),
    }
  );

  const data = await response.json();

  if (!data?.data?.task_id) {
    throw new Error("Failed to create image task");
  }

  return data.data.task_id;
};

export const getFreepikImageStatus = async (taskId) => {
  const apiKey = process.env.FREEPIK_API_KEY;

  const response = await fetch(
    `https://api.freepik.com/v1/ai/text-to-image/flux-dev/${taskId}`,
    {
      method: "GET",
      headers: {
        "x-freepik-api-key": apiKey,
      },
    }
  );

  const data = await response.json();
  return data.data;
};