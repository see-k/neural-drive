
export interface WikiData {
  title: string;
  content: string;
  url: string;
  imageUrl?: string;
}

export const fetchWikipediaData = async (query: string): Promise<WikiData | null> => {
  try {
    // 1. Search to get the correct canonical title
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&namespace=0&format=json&origin=*`;
    const searchRes = await fetch(searchUrl);
    const searchData = await searchRes.json();

    // opensearch returns [query, [titles], [descriptions], [urls]]
    if (!searchData[1] || searchData[1].length === 0) {
      return null;
    }

    const title = searchData[1][0];
    const url = searchData[3][0];

    // 2. Parallel Fetch: HTML content via REST API and Summary (for image)
    const contentPromise = fetch(`https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(title)}`)
                            .then(r => r.ok ? r.text() : null);
    
    const summaryPromise = fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`)
                            .then(r => r.ok ? r.json() : null);

    const [html, summary] = await Promise.all([contentPromise, summaryPromise]);

    if (!html) return null;

    let cleanHtml = html;

    // 3. Post-process HTML
    // Fix relative links to absolute so they work
    cleanHtml = cleanHtml.replace(/href="\.\//g, 'href="https://en.wikipedia.org/wiki/');
    cleanHtml = cleanHtml.replace(/href="\/wiki\//g, 'target="_blank" href="https://en.wikipedia.org/wiki/');
    
    // Fix image sources (protocol relative to absolute https)
    cleanHtml = cleanHtml.replace(/src="\/\//g, 'src="https://');
    cleanHtml = cleanHtml.replace(/srcset="\/\//g, 'srcset="https://');

    return {
      title,
      content: cleanHtml,
      url,
      imageUrl: summary?.originalimage?.source || summary?.thumbnail?.source
    };
  } catch (error) {
    console.warn("Wikipedia fetch failed:", error);
    return null;
  }
};