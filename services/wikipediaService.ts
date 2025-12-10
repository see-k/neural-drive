
export interface WikiData {
  title: string;
  content: string;
  url: string;
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

    // 2. Fetch HTML content via REST API (provides semantic HTML)
    const contentUrl = `https://en.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(title)}`;
    const contentRes = await fetch(contentUrl);

    if (!contentRes.ok) return null;

    let html = await contentRes.text();

    // 3. Post-process HTML
    // Fix relative links to absolute so they work
    html = html.replace(/href="\.\//g, 'href="https://en.wikipedia.org/wiki/');
    html = html.replace(/href="\/wiki\//g, 'target="_blank" href="https://en.wikipedia.org/wiki/');
    
    // Fix image sources (protocol relative to absolute https)
    html = html.replace(/src="\/\//g, 'src="https://');
    html = html.replace(/srcset="\/\//g, 'srcset="https://');
    
    // Remove specific problematic tags if simple regex permits, 
    // though CSS display:none is safer for structure.
    // We rely mostly on CSS in index.html to hide .infobox, .mw-editsection, etc.

    return {
      title,
      content: html,
      url
    };
  } catch (error) {
    console.warn("Wikipedia fetch failed:", error);
    return null;
  }
};