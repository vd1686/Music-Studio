export const fetchLyrics = async (artist: string, title: string): Promise<string> => {
    try {
        const response = await fetch(`https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`);
        if (!response.ok) {
            return "Lyrics not found for this song.";
        }
        const data = await response.json();
        // The API returns 2 newlines for a line break, so we replace them with a single one for better formatting.
        return data.lyrics.replace(/(\r\n|\n|\r){2}/g, '\n') || "Lyrics not found for this song.";
    } catch (error) {
        console.error("Failed to fetch lyrics:", error);
        return "Could not fetch lyrics. Please check your internet connection.";
    }
};
