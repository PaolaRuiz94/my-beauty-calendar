const YOUTUBE_API_KEY = 'AIzaSyDCpbq1rrVitsmZT18iOYM7PNH35DrNxZE'; // Reemplaza con tu clave de YouTube Data API v3

export async function searchYouTubeVideos(query, maxResults = 8) {
  const url =
    `https://www.googleapis.com/youtube/v3/search` +
    `?part=snippet&type=video&key=${YOUTUBE_API_KEY}` +
    `&q=${encodeURIComponent(query)}` +
    `&maxResults=${maxResults}` +
    `&relevanceLanguage=es` +
    `&regionCode=CO`;

  try {
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    return (data.items ?? []).map((item) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      channel: item.snippet.channelTitle,
      thumbnail:
        item.snippet.thumbnails?.medium?.url ??
        `https://img.youtube.com/vi/${item.id.videoId}/mqdefault.jpg`,
    }));
  } catch {
    return [];
  }
}
