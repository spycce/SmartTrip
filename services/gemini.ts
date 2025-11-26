import { TravelMode, Trip } from '../types';

// The API key is injected via Vite environment variables (from Docker build args)
const API_KEY = process.env.API_KEY;

export const generateTripPlan = async (
  from: string,
  to: string,
  startDate: string,
  endDate: string,
  mode: TravelMode
): Promise<Partial<Trip>> => {

  const prompt = `
    Plan a detailed trip from ${from} to ${to} traveling by ${mode} from ${startDate} to ${endDate}.
    
    IMPORTANT: Provide a response in valid JSON format.
    
    Requirements:
    1. A short inspirational summary (max 200 chars).
    2. A detailed daily itinerary. 
       - For each day, provide a title (e.g., "City A -> City B").
       - A brief description of the day.
       - Key stats: Distance (if moving) and Travel Time.
       - Route: Major waypoints.
       - Sections: Break down the day into "Morning", "Afternoon", "Evening", or "Suggested Stops", "Check-in", etc.
       - Activities: A flat list of key activities for quick scanning.
       - Image Keywords: 2-3 keywords to search for images of this location (e.g., "Eiffel Tower", "Paris Cafe").
    3. Estimated expenses in INR (Indian Rupees). Provide at least 5-6 categories (e.g., Food, Travel, Stay, Activities, Misc).
    4. Coordinates: Start and End.

    IMPORTANT: Ensure 'itinerary' and 'expenses' arrays are NEVER empty. Populate them with realistic data.

    Response Schema:
    {
        "summary": "string",
        "itinerary": [
            { 
                "day": 1, 
                "title": "Day Title", 
                "description": "Day description...",
                "distance": "100 km",
                "travelTime": "2 hrs",
                "route": "A -> B -> C",
                "activities": ["Activity 1", "Activity 2"],
                "sections": [
                    { "title": "Morning", "items": ["Breakfast at X", "Visit Y"] }
                ],
                "image_keywords": ["keyword1", "keyword2"]
            }
        ],
        "expenses": [
             { "category": "string", "amount": number }
        ],
        "coordinates": {
            "start": { "lat": number, "lng": number },
            "end": { "lat": number, "lng": number }
        }
    }
  `;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "HTTP-Referer": "http://localhost:80", // Site URL
        "X-Title": "SmartTrip Planner", // Site title
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        "model": "openai/gpt-4o-mini",
        "messages": [
          {
            "role": "user",
            "content": prompt
          }
        ]
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (content) {
      // Clean up markdown code blocks if present
      const jsonString = content.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(jsonString);
    }
    throw new Error("No response content from OpenRouter");
  } catch (error) {
    console.error("OpenRouter Error:", error);
    throw new Error("Failed to generate trip plan. Please check your API limits or try again.");
  }
};