export const fetchLocationImage = async (query: string): Promise<string | null> => {
    try {
        // 1. Try Wikipedia API (Best for landmarks/cities)
        const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&origin=*&titles=${encodeURIComponent(query)}`;
        const wikiRes = await fetch(wikiUrl);
        const wikiData = await wikiRes.json();

        // Extract image URL from Wiki response structure
        const pages = wikiData.query?.pages;
        if (pages) {
            const pageId = Object.keys(pages)[0];
            if (pageId && pages[pageId].original) {
                return pages[pageId].original.source;
            }
        }

        // 2. Fallback: Return null to let UI show a placeholder
        return null;

    } catch (error) {
        console.error("Image Fetch Error:", error);
        return null;
    }
};
