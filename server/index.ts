import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

// Load env
dotenv.config();

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

app.use(cors());
app.use(express.json());

// Types for clarity
interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  type: 'video' | 'book' | 'doc' | 'pdf' | 'article' | string;
  language: string;
  framework?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | string;
  tags: string[];
  author?: string;
  rating?: number;
  bookmarked?: boolean;
}

// Fallback mock (for development only, when external API fails)
const fallbackData: Resource[] = [
  // Minimal sample (we'll keep small to avoid duplicating front-end mock)
  {
    id: 'ex1',
    title: 'React Official Docs',
    description: 'The official React documentation with guides and API references.',
    url: 'https://react.dev/learn',
    type: 'doc',
    language: 'javascript',
    framework: 'react',
    difficulty: 'beginner',
    tags: ['official', 'docs'],
    author: 'React Team',
    rating: 4.9,
  },
  {
    id: 'ex2',
    title: 'Docker Deep Dive',
    description: 'A comprehensive guide to Docker concepts and best practices.',
    url: 'https://docs.docker.com/',
    type: 'doc',
    language: 'docker',
    difficulty: 'intermediate',
    tags: ['containers', 'devops'],
    rating: 4.7,
  },
];

// Map DEV.to article schema -> Resource
function detectTypeFromUrl(url: string | undefined): Resource['type'] {
  if (!url) return 'article';
  const u = url.toLowerCase();
  if (/\.pdf($|\?)/.test(u)) return 'pdf';
  if (u.includes('youtube.com') || u.includes('youtu.be') || u.includes('vimeo.com') || u.includes('dailymotion.com')) return 'video';
  if (u.includes('/docs') || u.includes('docs.') || u.includes('developer.mozilla.org') || u.includes('nodejs.org') || u.includes('react.dev') || u.includes('angular.io') || u.includes('vuejs.org')) return 'doc';
  return 'article';
}

function mapDevToArticleToResource(article: any): Resource {
  const primaryUrl = article.canonical_url || article.url || (article.path ? `https://dev.to${article.path}` : undefined);
  const type = detectTypeFromUrl(primaryUrl);
  return {
    id: String(article.id),
    title: article.title ?? "Untitled",
    description: article.description || article.body_text || "",
    url: primaryUrl || "#",
    type,
    language: "general",
    framework: undefined,
    difficulty: "intermediate",
    tags: Array.isArray(article.tag_list)
      ? article.tag_list
      : (typeof article.tags === 'string' ? String(article.tags).split(',').map((t: string) => t.trim()).filter(Boolean) : []),
    author: article.user?.name || article.user?.username || undefined,
    rating: undefined,
  };
}

// Helper: basic filtering on fallback data
function filterAndPaginate(
  data: Resource[],
  {
    query,
    type,
    language,
    framework,
    difficulty,
    tags,
    page = 1,
    pageSize = 12,
  }: {
    query?: string;
    type?: string;
    language?: string;
    framework?: string;
    difficulty?: string;
    tags?: string[];
    page?: number;
    pageSize?: number;
  }
) {
  let filtered = data.slice();

  if (query) {
    const q = query.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        (r.tags || []).some((t) => t.toLowerCase().includes(q))
    );
  }
  if (type && type !== 'all') filtered = filtered.filter((r) => r.type === type);
  if (language && language !== 'all') filtered = filtered.filter((r) => r.language === language);
  if (framework && framework !== 'all') filtered = filtered.filter((r) => r.framework === framework);
  if (difficulty && difficulty !== 'all') filtered = filtered.filter((r) => r.difficulty === difficulty);
  if (tags && tags.length > 0) filtered = filtered.filter((r) => tags!.some((t) => r.tags.includes(t)));

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const items = filtered.slice(start, end);

  return { items, total, page, pageSize, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

app.get('/api/resources', async (req, res) => {
  try {
    const apiKey = process.env.RESOURCE_API_KEY || process.env.API_KEY || process.env.OPENAI_API_KEY || process.env.GENAI_API_KEY;
    const providerUrl = process.env.RESOURCE_API_URL; // if not set, we'll default to DEV.to
    const youtubeKey = process.env.YOUTUBE_API_KEY;
    const googleBooksKey = process.env.GOOGLE_BOOKS_API_KEY;
    const provider = String(req.query.provider || '').toLowerCase(); // e.g., 'youtube' to fetch from YouTube

    const query = String(req.query.query || '');
    const type = String(req.query.type || 'all');
    const language = String(req.query.language || 'all');
    const framework = String(req.query.framework || 'all');
    const difficulty = String(req.query.difficulty || 'all');
    const tags = Array.isArray(req.query.tags)
      ? (req.query.tags as string[])
      : typeof req.query.tags === 'string' && req.query.tags.length
      ? (req.query.tags as string).split(',')
      : [];
    const page = Number(req.query.page || 1);
    const pageSize = Number(req.query.pageSize || 12);

    // Try external provider first
    try {
      // Special handling: if type is 'all' and no explicit provider is requested,
      // assemble a mixed feed from multiple sources to surface varied resource types.
      if ((!provider || provider === 'mixed') && (type === 'all' || !type)) {
        // Collect from multiple sources best-effort
        const q = query || (tags[0] || 'programming');
        const maxPerSource = Math.max(1, Math.floor((pageSize || 12) / 3));

        const tasks: Promise<Resource[]>[] = [];

        // DEV.to
        tasks.push((async () => {
          const params: Record<string, any> = q
            ? { page, per_page: maxPerSource, q }
            : { page, per_page: maxPerSource };
          const headers: Record<string, string> = { 'Content-Type': 'application/json' };
          if (process.env.RESOURCE_API_KEY) headers['api-key'] = process.env.RESOURCE_API_KEY;
          const resp = await axios.get('https://dev.to/api/' + (q ? 'search/articles' : 'articles'), { params, headers, timeout: 12000 });
          const data = resp.data;
          const itemsRaw: any[] = Array.isArray(data)
            ? data
            : (data.items || data.result || data.results || []);
          return itemsRaw.map(mapDevToArticleToResource);
        })().catch(() => []));

        // YouTube (videos)
        if (youtubeKey) {
          tasks.push((async () => {
            const ytResp = await axios.get('https://www.googleapis.com/youtube/v3/search', {
              params: { key: youtubeKey, part: 'snippet', q: q, type: 'video', maxResults: maxPerSource },
              timeout: 12000,
            });
            const itemsRaw: any[] = ytResp.data?.items || [];
            return itemsRaw
              .filter((it: any) => it.id?.videoId && it.snippet)
              .map((it: any) => ({
                id: String(it.id.videoId),
                title: it.snippet.title || 'Untitled',
                description: it.snippet.description || '',
                url: `https://www.youtube.com/watch?v=${it.id.videoId}`,
                type: 'video' as const,
                language: 'general',
                difficulty: 'intermediate' as const,
                tags: [],
                author: it.snippet.channelTitle,
              }));
          })().catch(() => []));
        }

        // Google Books (books/pdfs)
        tasks.push((async () => {
          const gbResp = await axios.get('https://www.googleapis.com/books/v1/volumes', {
            params: { q, printType: 'books', maxResults: maxPerSource, startIndex: Math.max(0, (page - 1) * maxPerSource), key: googleBooksKey },
            timeout: 12000,
          });
          const itemsRaw: any[] = Array.isArray(gbResp.data?.items) ? gbResp.data.items : [];
          return itemsRaw.map((it: any) => {
            const vol = it.volumeInfo || {};
            const access = it.accessInfo || {};
            const pdfAvailable = !!access?.pdf?.isAvailable;
            const infoLink = vol.infoLink || access?.webReaderLink || vol.canonicalVolumeLink;
            const downloadLink = access?.pdf?.downloadLink || access?.epub?.downloadLink || infoLink;
            const authors: string[] = Array.isArray(vol.authors) ? vol.authors : [];
            return {
              id: String(it.id || vol.industryIdentifiers?.[0]?.identifier || infoLink || vol.title),
              title: vol.title || 'Untitled',
              description: vol.subtitle || vol.description || '',
              url: downloadLink || infoLink || '#',
              type: pdfAvailable ? 'pdf' : 'book',
              language: vol.language || 'general',
              difficulty: 'intermediate',
              tags: Array.isArray(vol.categories) ? vol.categories.slice(0, 5) : [],
              author: authors.length ? authors[0] : undefined,
            } as Resource;
          });
        })().catch(() => []));

        const results = await Promise.all(tasks);
        const merged = results.flat();

        // Simple de-dupe by URL
        const seen = new Set<string>();
        const unique: Resource[] = [];
        for (const r of merged) {
          const k = r.url;
          if (!seen.has(k)) { seen.add(k); unique.push(r); }
        }
        const items = unique.slice(0, pageSize);
        return res.json({ items, total: items.length, page, pageSize, totalPages: 1 });
      }
      // Provider: Google Books (books/pdfs/free)
      if (provider === 'googlebooks') {
        const q = query && query.length ? query : (tags[0] || 'programming');
        const maxResults = Math.max(1, Math.min(40, pageSize));
        const startIndex = Math.max(0, (page - 1) * maxResults);
        const gbBase = 'https://www.googleapis.com/books/v1/volumes';

        const gbParams: Record<string, any> = {
          q,
          printType: 'books',
          maxResults,
          startIndex,
          key: googleBooksKey,
        };

        // If the user is specifically interested in free books, we can hint via tags
        if (tags.includes('free') || difficulty === 'beginner') {
          gbParams.filter = 'free-ebooks';
        }

        const gbResp = await axios.get(gbBase, { params: gbParams, timeout: 15000 });
        const totalItems = Number(gbResp.data?.totalItems || 0);
        const itemsRaw: any[] = Array.isArray(gbResp.data?.items) ? gbResp.data.items : [];

        const mapped: Resource[] = itemsRaw.map((it: any) => {
          const vol = it.volumeInfo || {};
          const access = it.accessInfo || {};
          const pdfAvailable = !!access?.pdf?.isAvailable;
          const epubAvailable = !!access?.epub?.isAvailable;
          const infoLink = vol.infoLink || access?.webReaderLink || vol.canonicalVolumeLink;
          const downloadLink = access?.pdf?.downloadLink || access?.epub?.downloadLink || infoLink;
          const authors: string[] = Array.isArray(vol.authors) ? vol.authors : [];
          const categories: string[] = Array.isArray(vol.categories) ? vol.categories : [];

          return {
            id: String(it.id || vol.industryIdentifiers?.[0]?.identifier || infoLink || vol.title),
            title: vol.title || 'Untitled',
            description: vol.subtitle || vol.description || '',
            url: downloadLink || infoLink || '#',
            type: pdfAvailable ? 'pdf' : 'book',
            language: vol.language || 'general',
            framework: undefined,
            difficulty: 'intermediate',
            tags: [...categories].slice(0, 5),
            author: authors.length ? authors[0] : undefined,
          };
        });

        // Apply type filter if requested (pdf/book)
        const filtered = (type && type !== 'all') ? mapped.filter((r) => r.type === type) : mapped;

        const totalPages = Math.max(1, Math.ceil(totalItems / maxResults));
        return res.json({ items: filtered, total: totalItems, page, pageSize: maxResults, totalPages });
      }
      // Provider: FreeBooks via RapidAPI (books)
      if (provider === 'freebooks') {
        const rapidKey = process.env.RAPIDAPI_KEY;
        if (!rapidKey) throw new Error('RAPIDAPI_KEY is not set');

        const genre = (tags[0] || query || 'programming').toString().toLowerCase().replace(/\s+/g, '-');
        const pageNum = Math.max(1, page);
        const fbUrl = `https://freebooks-api2.p.rapidapi.com/fetchEbooks/${encodeURIComponent(genre)}/${pageNum}`;

        const fbResp = await axios.get(fbUrl, {
          headers: {
            'x-rapidapi-host': 'freebooks-api2.p.rapidapi.com',
            'x-rapidapi-key': rapidKey,
          },
          timeout: 15000,
        });

        let booksRaw: any[] = [];
        if (Array.isArray(fbResp.data)) booksRaw = fbResp.data;
        else if (Array.isArray(fbResp.data?.data)) booksRaw = fbResp.data.data;
        else if (Array.isArray(fbResp.data?.items)) booksRaw = fbResp.data.items;

        const mapped: Resource[] = booksRaw.map((b: any, idx: number) => {
          // Try to detect best fields; be defensive in case of schema variations
          const title = b.title || b.name || b.bookTitle || 'Untitled';
          const description = b.description || b.desc || b.summary || '';
          const link = b.url || b.link || b.bookLink || b.download || b.source || '#';
          const author = b.author || b.writer || b.creator || undefined;
          const tagsOut: string[] = [];
          if (b.genre) tagsOut.push(String(b.genre));
          if (b.category) tagsOut.push(String(b.category));
          return {
            id: String(b.id || b.isbn || `${genre}-${pageNum}-${idx}`),
            title,
            description,
            url: link,
            type: 'book',
            language: 'general',
            framework: undefined,
            difficulty: 'intermediate',
            tags: tagsOut,
            author,
          };
        });

        // Apply type filter if requested
        const filtered = (type && type !== 'all') ? mapped.filter((r) => r.type === type) : mapped;

        // FreeBooks endpoint is paginated by path; we don't get total count => best-effort like DEV.to
        const hasNext = filtered.length > 0; // assume another page may exist if we got results
        const totalPages = hasNext ? page + 1 : page;
        const total = (page - 1) * pageSize + filtered.length + (hasNext ? 1 : 0);

        return res.json({ items: filtered, total, page, pageSize, totalPages });
      }
      // Provider: OpenLibrary (docs)
      if (provider === 'openlibrary') {
        const q = query || (tags[0] || 'programming');
        const limit = Math.max(1, Math.min(50, pageSize));
        const olBase = 'https://openlibrary.org/search.json';

        const olResp = await axios.get(olBase, {
          params: { q: q, page, limit },
          timeout: 15000,
        });

        const docs: any[] = olResp.data?.docs || [];
        const mapped: Resource[] = docs.map((d) => {
          const key: string | undefined = d.key; // e.g. "/works/OL45804W"
          const url = key ? `https://openlibrary.org${key}` : '#';
          const language = Array.isArray(d.language) && d.language.length ? String(d.language[0]) : 'general';
          const subjects: string[] = Array.isArray(d.subject) ? d.subject.slice(0, 5) : [];
          const author = Array.isArray(d.author_name) && d.author_name.length ? String(d.author_name[0]) : undefined;
          const description = d.first_sentence ? String(d.first_sentence) : (d.subtitle || '');
          return {
            id: String(d.key || d.cover_edition_key || d.edition_key?.[0] || d.title),
            title: d.title || 'Untitled',
            description: description,
            url,
            type: 'book',
            language,
            framework: undefined,
            difficulty: 'intermediate',
            tags: subjects,
            author,
          };
        });

        // Apply type filter if requested
        const filtered = (type && type !== 'all') ? mapped.filter((r) => r.type === type) : mapped;

        // OpenLibrary returns numFound (approximate total results)
        const numFound = Number(olResp.data?.numFound || 0);
        const totalPages = Math.max(1, Math.ceil(numFound / limit));
        const safeTotalPages = Number.isFinite(totalPages) && totalPages > 0 ? totalPages : page; 

        return res.json({ items: filtered, total: numFound, page, pageSize: limit, totalPages: safeTotalPages });
      }

      // Provider: YouTube
      if (provider === 'youtube') {
        if (!youtubeKey) throw new Error('YOUTUBE_API_KEY is not set');

        const q = query || 'programming tutorials';
        const maxResults = Math.max(1, Math.min(50, pageSize));

        // Helper to advance to the requested page by following nextPageToken
        const ytBase = 'https://www.googleapis.com/youtube/v3/search';
        let pageToken: string | undefined = undefined;
        if (page > 1) {
          // Walk (page-1) times to get the token for the desired page
          let currentToken: string | undefined;
          for (let i = 1; i < page; i++) {
            const r = await axios.get(ytBase, {
              params: {
                key: youtubeKey,
                part: 'snippet',
                q,
                type: 'video',
                maxResults,
                pageToken: currentToken,
              },
              timeout: 15000,
            });
            currentToken = r.data?.nextPageToken;
            if (!currentToken) break; // no more pages
          }
          pageToken = undefined; // we already advanced; next request will be the target page
          // Note: since we advanced (page-1) times, the next fetch below will return the requested page
          // by using the last token fetched in the loop above. To apply it, we refetch once more with that token.
          // If loop ended early, it means page exceeds available pages.
        }

        const fetchParams: Record<string, any> = {
          key: youtubeKey,
          part: 'snippet',
          q,
          type: 'video',
          maxResults,
        };
        if (page > 1) {
          // Re-run one more fetch with the last computed token from the loop
          // To get that last token, we need to recompute similarly but store the token.
          // Simpler approach: do the walk again storing the last token
          let currentToken: string | undefined;
          for (let i = 1; i < page; i++) {
            const r = await axios.get(ytBase, {
              params: {
                key: youtubeKey,
                part: 'snippet',
                q,
                type: 'video',
                maxResults,
                pageToken: currentToken,
              },
              timeout: 15000,
            });
            currentToken = r.data?.nextPageToken;
            if (!currentToken) {
              break; // requested page beyond available pages
            }
          }
          if (currentToken) fetchParams.pageToken = currentToken;
        }

        const ytResp = await axios.get(ytBase, { params: fetchParams, timeout: 15000 });
        const itemsRaw: any[] = ytResp.data?.items || [];
        const mapped: Resource[] = itemsRaw
          .filter((it: any) => it.id?.videoId && it.snippet)
          .map((it: any) => {
            const videoId = it.id.videoId;
            const url = `https://www.youtube.com/watch?v=${videoId}`;
            return {
              id: String(videoId),
              title: it.snippet.title || 'Untitled',
              description: it.snippet.description || '',
              url,
              type: 'video',
              language: 'general',
              framework: undefined,
              difficulty: 'intermediate',
              tags: [],
              author: it.snippet.channelTitle,
            };
          });

        // YouTube pagination: has next if nextPageToken is present
        const hasNext = !!ytResp.data?.nextPageToken;
        const totalPages = hasNext ? page + 1 : page;
        const total = (page - 1) * pageSize + mapped.length + (hasNext ? 1 : 0);

        // Apply type filter (videos only)
        const filtered = (type && type !== 'all') ? mapped.filter((r) => r.type === type) : mapped;
        return res.json({ items: filtered, total, page, pageSize, totalPages });
      }

      // Determine target: ENV provider or DEV.to
      let baseUrl = providerUrl;
      let params: Record<string, any> = {};

      if (!baseUrl) {
        // Use DEV.to Articles API
        // Search endpoint when query is present, otherwise listing endpoint
        if (query) {
          baseUrl = 'https://dev.to/api/search/articles';
          params = { page, per_page: pageSize, q: query };
        } else {
          baseUrl = 'https://dev.to/api/articles';
          params = { page, per_page: pageSize };
          // If tags provided, DEV.to supports single tag via `tag`
          if (tags.length > 0) {
            params.tag = tags[0];
          }
        }
      } else {
        // Custom provider: forward common params as-is
        params = { query, type, language, framework, difficulty, tags: tags.join(','), page, pageSize };
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      // DEV.to uses 'api-key' header for authenticated requests (optional)
      if (apiKey) {
        // If a custom provider is used, they might expect Bearer; DEV.to expects 'api-key'
        if (baseUrl.includes('dev.to')) headers['api-key'] = apiKey;
        else headers['Authorization'] = `Bearer ${apiKey}`;
      }

      const response = await axios.get(baseUrl, { params, headers, timeout: 15000 });

      // Shape response into our expected structure
      let itemsRaw: any[] = Array.isArray(response.data) ? response.data : (response.data.items || []);
      let mapped = itemsRaw.map(mapDevToArticleToResource);

      // Apply type filter if requested
      if (type && type !== 'all') {
        mapped = mapped.filter((r) => r.type === type);
      }

      // Probe next page to determine if there are more pages (DEV.to does not return totals)
      let hasNext = false;
      try {
        const nextParams = { ...params, page: page + 1 };
        const nextResp = await axios.get(baseUrl, { params: nextParams, headers, timeout: 12000 });
        const nextRaw: any[] = Array.isArray(nextResp.data) ? nextResp.data : (nextResp.data.items || []);
        let nextMapped = nextRaw.map(mapDevToArticleToResource);
        if (type && type !== 'all') nextMapped = nextMapped.filter((r) => r.type === type);
        hasNext = nextMapped.length > 0;
      } catch {
        // ignore probe errors
      }

      // Compute totals (best-effort)
      const totalPages = hasNext ? page + 1 : page;
      const total = (page - 1) * pageSize + mapped.length + (hasNext ? 1 : 0);

      return res.json({ items: mapped, total, page, pageSize, totalPages });
    } catch (providerErr: any) {
      console.warn('Provider fetch failed, falling back to local data:', providerErr?.message || providerErr);
      // Fallback to local filtering
      const result = filterAndPaginate(fallbackData, { query, type, language, framework, difficulty, tags, page, pageSize });
      return res.json(result);
    }
  } catch (err: any) {
    console.error('Error fetching resources:', err?.response?.data || err?.message || err);
    return res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// Simple Chat endpoint using OpenAI Chat Completions API
app.post('/api/chat', async (req, res) => {
  try {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not set on the server' });
    }

    const { messages, model } = req.body || {};
    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Request body must include non-empty messages array' });
    }

    // Prepare a list of candidate model IDs to try (no '-latest' aliases to avoid 404s)
    const requestedModelRaw = (typeof model === 'string' && model.length ? model : 'gemini-1.5-flash').toLowerCase();
    const normalize: Record<string, string> = {
      'gemini-1.5-flash-latest': 'gemini-1.5-flash',
      'gemini-1.5-pro-latest': 'gemini-1.5-pro',
      'flash': 'gemini-1.5-flash',
      'pro': 'gemini-1.5-pro',
      'latest': 'gemini-1.5-flash',
    };
    const requestedModel = normalize[requestedModelRaw] || requestedModelRaw;
    const candidateModels = Array.from(new Set([
      requestedModel,
      'gemini-1.5-flash',
      'gemini-1.5-flash-8b',
      'gemini-1.5-pro',
    ]));

    // Map OpenAI-style messages to Gemini contents
    // Gemini expects roles: 'user' | 'model'. We'll map 'assistant' -> 'model'.
    // If there's a 'system' message, prepend it to the first user message.
    const systemMsg = messages.find((m: any) => m?.role === 'system');
    const nonSystem = messages.filter((m: any) => m?.role !== 'system');

    // If first is user, prepend system text to its content; else insert a first user turn with system text.
    let prepared = nonSystem.map((m: any) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: String(m.content || '') }],
    }));
    if (systemMsg?.content) {
      if (prepared.length && prepared[0].role === 'user') {
        prepared[0] = {
          ...prepared[0],
          parts: [{ text: `${systemMsg.content}\n\n${prepared[0].parts?.[0]?.text || ''}` }],
        };
      } else {
        prepared.unshift({ role: 'user', parts: [{ text: String(systemMsg.content) }] });
      }
    }

    let lastErr: any = null;
    for (const m of candidateModels) {
      try {
        // Try v1beta first with API key in header
        const urlV1Beta = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(m)}:generateContent`;
        let response = await axios.post(
          urlV1Beta,
          { contents: prepared, generationConfig: { temperature: 0.7 } },
          { headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY }, timeout: 20000 }
        );
        const candidates = response.data?.candidates;
        const first = Array.isArray(candidates) && candidates.length ? candidates[0] : null;
        const parts = first?.content?.parts;
        const text = Array.isArray(parts) && parts.length ? (parts[0]?.text || '') : '';
        return res.json({ content: text, model: m });
      } catch (e: any) {
        lastErr = e;
        // If v1beta failed with 404/403, try v1
        const status = e?.response?.status;
        if (status === 404 || status === 403) {
          try {
            const urlV1 = `https://generativelanguage.googleapis.com/v1/models/${encodeURIComponent(m)}:generateContent`;
            const response = await axios.post(
              urlV1,
              { contents: prepared, generationConfig: { temperature: 0.7 } },
              { headers: { 'Content-Type': 'application/json', 'x-goog-api-key': GEMINI_API_KEY }, timeout: 20000 }
            );
            const candidates = response.data?.candidates;
            const first = Array.isArray(candidates) && candidates.length ? candidates[0] : null;
            const parts = first?.content?.parts;
            const text = Array.isArray(parts) && parts.length ? (parts[0]?.text || '') : '';
            return res.json({ content: text, model: m });
          } catch (e2: any) {
            lastErr = e2;
            if (e2?.response?.status === 404 || e2?.response?.status === 403) {
              continue; // try next candidate model
            }
          }
        }
        break; // other errors: stop
      }
    }
    // Optional mock fallback for demos if Gemini fails
    try {
      const body = req.body || {};
      const messages = Array.isArray(body.messages) ? body.messages : [];
      if (String(process.env.CHATBOT_MOCK_ON_FAILURE).toLowerCase() === 'true') {
        const lastUser = [...messages].reverse().find((m: any) => m?.role === 'user');
        const prompt = lastUser?.content || 'your topic';
        const mock = `Mock reply: I cannot reach the LLM service right now, but here are thoughts about "${prompt}".`;
        return res.json({ content: mock, model: 'mock' });
      }
    } catch {}

    const status = lastErr?.response?.status || 500;
    const data = lastErr?.response?.data || { error: lastErr?.message || 'Unknown error' };
    console.error('Gemini chat error:', data);
    return res.status(status).json({ error: 'Failed to get chat response', details: data });
  } catch (err: any) {
    // Optional mock fallback for demos if Gemini fails
    try {
      const body = req.body || {};
      const messages = Array.isArray(body.messages) ? body.messages : [];
      if (String(process.env.CHATBOT_MOCK_ON_FAILURE).toLowerCase() === 'true') {
        const lastUser = [...messages].reverse().find((m: any) => m?.role === 'user');
        const prompt = lastUser?.content || 'your topic';
        const mock = `Mock reply: I cannot reach the LLM service right now, but here are thoughts about "${prompt}".`;
        return res.json({ content: mock, model: 'mock' });
      }
    } catch {}

    const status = err?.response?.status || 500;
    const data = err?.response?.data || { error: err?.message || 'Unknown error' };
    console.error('Gemini chat error:', data);
    return res.status(status).json({ error: 'Failed to get chat response', details: data });
  }
});

app.listen(PORT, () => {
  console.log(`DevResourceHub API server running on http://localhost:${PORT}`);
});
