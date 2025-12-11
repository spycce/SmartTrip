const PEXELS_KEY = import.meta.env.VITE_PEXELS_API_KEY;

export const fetchLocationImage = async (query: string): Promise<string | null> => {
    console.log(`[ImageService] Fetching image for: "${query}"`);
    console.log(`[ImageService] API Key available: ${!!PEXELS_KEY}`);

    if (!PEXELS_KEY) {
        console.warn("Pexels API Key is missing. Check .env");
        return null; // Fallback to placeholder
    }

    try {
        const response = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`, {
            headers: {
                Authorization: PEXELS_KEY
            }
        });

        if (!response.ok) {
            throw new Error(`Pexels API Error: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.photos && data.photos.length > 0) {
            // Return 'large' or 'medium' for good quality/size balance
            return data.photos[0].src.large2x || data.photos[0].src.large;
        }
        return null;
    } catch (error) {
        console.error("Image Fetch Error:", error);
        return null;
    }
};
