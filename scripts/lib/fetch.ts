/** Small fetch helper with timeout and a polite User-Agent. */
export async function fetchText(url: string, timeoutMs = 20000): Promise<{ status: number; text: string; contentType: string }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; IBInterviewPrep-MarketPulse/1.0; +https://github.com/) RSS reader',
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8',
      },
    });
    const text = await res.text();
    return { status: res.status, text, contentType: res.headers.get('content-type') ?? '' };
  } finally {
    clearTimeout(t);
  }
}
