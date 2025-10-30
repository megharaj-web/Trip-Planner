import { GoogleGenAI, Modality } from "@google/genai";
import type { LatLng, TripPlan } from '../types';

if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable is not set.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateTripPlan(
  source: string,
  destination: string,
  interests: string,
  userLocation: LatLng | null
): Promise<TripPlan> {
  const prompt = `
    You are an expert trip planner. Your task is to suggest interesting places to visit between a source and a destination, based on the user's interests.
    Your response should be engaging, helpful, and formatted as a simple travel itinerary.

    Source: ${source}
    Destination: ${destination}
    Interests: ${interests}
    ${userLocation ? `The user's current location is approximately latitude ${userLocation.latitude}, longitude ${userLocation.longitude}. You can use this for more relevant "nearby" suggestions.` : ''}

    Please provide a suggested itinerary. For each suggested stop, provide a title using markdown bold (**Title**) and a brief, engaging description of 1-2 sentences. Structure the entire response as a coherent plan.
    Do not use numbered lists.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleMaps: {} }],
      },
      ...(userLocation && {
        toolConfig: {
          retrievalConfig: {
            latLng: userLocation
          }
        }
      })
    });

    const itinerary = response.text;
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    const locations = groundingMetadata?.groundingChunks?.filter(chunk => chunk.maps) || [];

    if (!itinerary) {
      throw new Error("Received an empty response from the AI. Please try a different query.");
    }
    
    return { itinerary, locations };

  } catch (error) {
    console.error("Error generating trip plan:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate trip plan: ${error.message}`);
    }
    throw new Error("An unknown error occurred while generating the trip plan.");
  }
}

export async function generatePlaceImage(placeName: string): Promise<string> {
  try {
    const prompt = `A beautiful, high-quality photograph of ${placeName}. Focus on its most iconic feature.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        const base64ImageBytes: string = part.inlineData.data;
        return `data:image/png;base64,${base64ImageBytes}`;
      }
    }
    throw new Error('No image data found in response.');
  } catch (error) {
    console.error(`Error generating image for ${placeName}:`, error);
    throw new Error(`Failed to generate image for ${placeName}.`);
  }
}
