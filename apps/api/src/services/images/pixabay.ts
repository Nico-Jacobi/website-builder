/**
 * Pixabay-Fetcher für den Backend-Image-Filler.
 * Liest PIXABAY_API_KEY aus process.env.
 */
export async function fetchPixabayImage(query: string): Promise<string> {
    const apiKey = process.env.PIXABAY_API_KEY;
    if (!apiKey || apiKey.trim() === '') {
        throw new Error('PIXABAY_API_KEY not set');
    }

    const params = new URLSearchParams({
        key: apiKey,
        q: query,
        image_type: 'photo',
        orientation: 'horizontal',
        safesearch: 'true',
        per_page: '3',
        page: '1',
    });
    const resp = await fetch(`https://pixabay.com/api/?${params}`);
    if (!resp.ok) throw new Error(`Pixabay ${resp.status}`);

    const data = (await resp.json()) as { hits?: { webformatURL: string }[] };
    const hits = data.hits ?? [];
    if (hits.length === 0) {
        throw new Error(`Pixabay: keine Ergebnisse für "${query}"`);
    }

    return hits[0].webformatURL;
}
