import { TravelMode, Trip } from '../types';



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
    1. A detailed, engaging, and inspirational summary (approx 150-200 words) that captures the essence of the trip.
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
    5. Transport Hubs: Provide the name and address for the nearest Airport, Bus Stand, Taxi Stand, and Railway Station for the DESTINATION city.

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
        },
        "transportHubs": {
             "airport": { "name": "string", "address": "string" },
             "busStand": { "name": "string", "address": "string" },
             "taxiStand": { "name": "string", "address": "string" },
             "railwayStation": { "name": "string", "address": "string" }
        }
    }
  `;

  try {
    // Get the standard auth token from localStorage (managed by your auth context/logic)
    const token = localStorage.getItem('token');

    const response = await fetch("/api/trip/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ prompt })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Server Error: ${errText}`);
    }

    const data = await response.json();
    const content = data.text;

    if (content) {
      // Clean up markdown code blocks if present
      const jsonString = content.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(jsonString);
    }
    throw new Error("No response content from server");
  } catch (error) {
    console.error("Trip Generation Error:", error);
    throw new Error("Failed to generate trip plan. Please try again.");
  }
};