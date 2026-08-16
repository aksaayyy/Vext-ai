import crypto from 'crypto';

const APP_ID = '936619743392459';
const PREFERRED_WIDTH = 720;

const chromeVersions = ['128', '129', '130', '131', '132', '133'];
const desktopPlatforms = [
  { chPlatform: 'Windows', uaToken: 'Windows NT 10.0; Win64; x64' },
  { chPlatform: 'macOS', uaToken: 'Macintosh; Intel Mac OS X 10_15_7' },
  { chPlatform: 'Linux', uaToken: 'X11; Linux x86_64' },
];
const acceptLanguages = ['en-US,en;q=0.9', 'en-GB,en;q=0.9', 'en;q=0.9', 'en-US,en;q=0.8'];

const instagramAppUserAgents = [
  'Instagram 275.0.0.27.98 Android (33/13; 280dpi; 720x1423; Xiaomi; Redmi 7; onclite; qcom; en_US; 458229237)',
  'Instagram 301.1.0.33.110 Android (34/14; 420dpi; 1080x2340; samsung; SM-G991B; o1s; exynos2100; en_US; 521879118)',
  'Instagram 309.0.0.40.113 Android (33/13; 440dpi; 1080x2280; OnePlus; HD1913; OnePlus7TPro; qcom; en_US; 537291984)',
];

interface BrowserFingerprint {
  acceptLanguage: string;
  secChUa: string;
  secChUaPlatform: string;
  userAgent: string;
}

function pick<T>(values: readonly T[]): T {
  return values[Math.floor(Math.random() * values.length)];
}

function randomToken(length = 8): string {
  const bytes = crypto.randomBytes(length);
  return [...bytes].map(b => (b % 36).toString(36)).join('');
}

export function browserFingerprint(): BrowserFingerprint {
  const version = pick(chromeVersions);
  const platform = pick(desktopPlatforms);
  return {
    acceptLanguage: pick(acceptLanguages),
    secChUa: `"Chromium";v="${version}", "Google Chrome";v="${version}", "Not_A Brand";v="24"`,
    secChUaPlatform: `"${platform.chPlatform}"`,
    userAgent: `Mozilla/5.0 (${platform.uaToken}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${version}.0.0.0 Safari/537.36`,
  };
}

function navigationHeaders(): Record<string, string> {
  const fp = browserFingerprint();
  return {
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'accept-language': fp.acceptLanguage,
    'sec-ch-ua': fp.secChUa,
    'sec-ch-ua-mobile': '?0',
    'sec-ch-ua-platform': fp.secChUaPlatform,
    'sec-fetch-dest': 'document',
    'sec-fetch-mode': 'navigate',
    'sec-fetch-site': 'none',
    'sec-fetch-user': '?1',
    'upgrade-insecure-requests': '1',
    'user-agent': fp.userAgent,
  };
}

function embedHeaders(): Record<string, string> {
  const fp = browserFingerprint();
  return {
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': fp.acceptLanguage,
    'Cache-Control': 'max-age=0',
    Dnt: '1',
    Priority: 'u=0, i',
    'Sec-Ch-Ua': fp.secChUa,
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': fp.secChUaPlatform,
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
    'User-Agent': fp.userAgent,
  };
}

function mobileHeaders(): Record<string, string> {
  return {
    'accept-language': 'en-US',
    'content-length': '0',
    'user-agent': pick(instagramAppUserAgents),
    'x-fb-client-ip': 'True',
    'x-fb-http-engine': 'Liger',
    'x-fb-server-cluster': 'True',
    'x-ig-app-locale': 'en_US',
    'x-ig-device-locale': 'en_US',
    'x-ig-mapped-locale': 'en_US',
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

export interface InstagramMediaResult {
  videoUrl: string;
  videoUrls: string[];
  dashManifest?: string;
  title: string;
  duration: number;
  uploader: string;
  shortcode: string;
}

export class InstagramScraperError extends Error {
  constructor(
    public reason: 'notFound' | 'rateLimited' | 'private' | 'ageRestricted' | 'loginRequired' | 'unavailable',
    message: string
  ) {
    super(message);
    this.name = 'InstagramScraperError';
  }
}

export async function resolveInstagramMedia(inputUrl: string): Promise<InstagramMediaResult> {
  const code = extractShortcode(inputUrl);
  if (!code) {
    throw new InstagramScraperError('unavailable', 'Instagram shortcode not found');
  }

  const videoRequired = /\/reel\/|\/reels\/|\/tv\//.test(inputUrl);

  const resolvers: Array<() => Promise<Json | null>> = [
    () => mobileMedia(code),
    () => pageMedia(code),
    () => embedMedia(code),
    () => graphqlMedia(code),
  ];

  const resolverNames = ['mobile', 'page', 'embed', 'graphql'];
  let primaryMedia: Json | null = null;
  const allVideoUrls: string[] = [];
  const seenUrls = new Set<string>();
  let primaryItems: MediaItem[] = [];

  for (let i = 0; i < resolvers.length; i++) {
    const candidate = await resolvers[i]();
    const items = candidate ? mediaItems(candidate, code) : [];
    if (!candidate || items.length === 0) {
      console.log(`[Instagram Scraper] ${resolverNames[i]} resolver returned no media for ${code}`);
      continue;
    }
    const videos = items.filter(item => item.kind === 'video');
    for (const item of videos) {
      if (!seenUrls.has(item.url)) {
        seenUrls.add(item.url);
        allVideoUrls.push(item.url);
      }
    }
    if (allVideoUrls.length > 0 && !primaryMedia) {
      primaryMedia = candidate;
      primaryItems = items;
      console.log(`[Instagram Scraper] Resolved via ${resolverNames[i]} resolver for ${code} (${videos.length} video rendition(s))`);
      if (isObject(candidate)) {
        const keys = Object.keys(candidate).filter(k => /video|audio|dash|codec/i.test(k));
        console.log(`[Instagram Scraper] Candidate media keys: ${keys.join(', ')}`);
      }
    } else {
      console.log(`[Instagram Scraper] ${resolverNames[i]} resolver added ${videos.length} more video rendition(s) for ${code}`);
    }
  }

  if (!primaryMedia || allVideoUrls.length === 0) {
    throw await classifyUnavailable(code);
  }

  const items = primaryItems;
  if (items.length === 0) {
    throw new InstagramScraperError('unavailable', 'Instagram media URL not found');
  }

  const videoItem = videoRequired
    ? items.find(item => item.kind === 'video')
    : items.find(item => item.kind === 'video') ?? items[0];

  if (!videoItem || videoItem.kind !== 'video') {
    throw new InstagramScraperError('unavailable', 'No video found in this Instagram post');
  }

  return {
    videoUrl: videoItem.url,
    videoUrls: allVideoUrls,
    dashManifest: isObject(primaryMedia) && typeof primaryMedia.video_dash_manifest === 'string' ? primaryMedia.video_dash_manifest : undefined,
    title: metadataTitle(primaryMedia),
    duration: metadataDuration(primaryMedia),
    uploader: metadataUploader(primaryMedia),
    shortcode: code,
  };
}

function extractShortcode(input: string): string | null {
  try {
    const url = new URL(input);
    const parts = url.pathname.split('/').filter(Boolean);
    const index = parts.findIndex(part => ['p', 'reel', 'reels', 'tv'].includes(part));
    const code = index >= 0 ? parts[index + 1] : parts[parts.length - 1];
    return code && !code.includes('.') ? code : null;
  } catch {
    return null;
  }
}

async function fetchText(url: string, headers: Record<string, string>, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { headers, signal: controller.signal, redirect: 'follow' });
  } finally {
    clearTimeout(timer);
  }
}

async function pageMedia(code: string): Promise<Json | null> {
  const response = await fetchText(`https://www.instagram.com/p/${code}/`, navigationHeaders());
  if (!response.ok) {
    return null;
  }
  const html = await response.text();
  const media = inlineMedia(html, code);
  return media && mediaItems(media, code).length > 0 ? media : null;
}

function inlineMedia(html: string, code: string): Json | null {
  for (const match of html.matchAll(/<script type="application\/json"[^>]*>([\s\S]*?)<\/script>/g)) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(match[1]);
    } catch {
      continue;
    }
    const media = searchMedia(parsed, code);
    if (media) {
      return media;
    }
  }
  return null;
}

function searchMedia(node: unknown, code: string): Json | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const media = searchMedia(child, code);
      if (media) {
        return media;
      }
    }
    return null;
  }
  if (!isObject(node)) {
    return null;
  }
  const hasMedia =
    Array.isArray(node.video_versions) ||
    Array.isArray(node.carousel_media) ||
    (isObject(node.image_versions2) && Array.isArray(node.image_versions2.candidates));
  if (hasMedia && node.code === code) {
    return node;
  }
  for (const key in node) {
    const media = searchMedia(node[key], code);
    if (media) {
      return media;
    }
  }
  return null;
}

async function mobileMedia(code: string): Promise<Json | null> {
  const id = (await mediaId(code)) ?? (await pageMediaId(code));
  if (!id) {
    return null;
  }
  const media = await mobileInfo(id);
  return media && mediaItems(media, code).length > 0 ? media : null;
}

async function mediaId(code: string): Promise<string | null> {
  const url = new URL('https://i.instagram.com/api/v1/oembed/');
  url.searchParams.set('url', `https://www.instagram.com/p/${code}/`);
  try {
    const response = await fetchText(url.href, mobileHeaders(), 10000);
    if (!response.ok) {
      console.log(`[Instagram Scraper] oembed mediaId failed: HTTP ${response.status}`);
      return null;
    }
    const payload = await response.json();
    return isObject(payload) && typeof payload.media_id === 'string' ? payload.media_id : null;
  } catch (error) {
    console.log(`[Instagram Scraper] oembed mediaId error: ${error instanceof Error ? error.message : 'unknown'}`);
    return null;
  }
}

async function pageMediaId(code: string): Promise<string | null> {
  try {
    const response = await fetchText(`https://www.instagram.com/p/${code}/`, navigationHeaders());
    if (!response.ok) {
      console.log(`[Instagram Scraper] page mediaId failed: HTTP ${response.status}`);
      return null;
    }
    const html = await response.text();
    for (const match of html.matchAll(/<script type="application\/json"[^>]*>([\s\S]*?)<\/script>/g)) {
      let parsed: unknown;
      try {
        parsed = JSON.parse(match[1]);
      } catch {
        continue;
      }
      const id = searchMediaId(parsed, code);
      if (id) {
        return id;
      }
    }
    return null;
  } catch (error) {
    console.log(`[Instagram Scraper] page mediaId error: ${error instanceof Error ? error.message : 'unknown'}`);
    return null;
  }
}

function searchMediaId(node: unknown, code: string): string | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const id = searchMediaId(child, code);
      if (id) {
        return id;
      }
    }
    return null;
  }
  if (!isObject(node)) {
    return null;
  }
  if (node.code === code) {
    if (typeof node.id === 'string' && /^\d+$/.test(node.id)) {
      return node.id;
    }
    if (typeof node.pk === 'string' && /^\d+$/.test(node.pk)) {
      return node.pk;
    }
    return null;
  }
  for (const key in node) {
    const id = searchMediaId(node[key], code);
    if (id) {
      return id;
    }
  }
  return null;
}

async function mobileInfo(mediaIdValue: string): Promise<Json | null> {
  try {
    const response = await fetchText(`https://i.instagram.com/api/v1/media/${mediaIdValue}/info/`, mobileHeaders(), 10000);
    if (!response.ok) {
      console.log(`[Instagram Scraper] mobile info failed: HTTP ${response.status} for id ${mediaIdValue}`);
      return null;
    }
    const payload = await response.json();
    const items = isObject(payload) && Array.isArray(payload.items) ? payload.items : [];
    const first = items[0];
    return isObject(first) ? first : null;
  } catch (error) {
    console.log(`[Instagram Scraper] mobile info error: ${error instanceof Error ? error.message : 'unknown'}`);
    return null;
  }
}

async function embedMedia(code: string): Promise<Json | null> {
  const response = await fetchText(`https://www.instagram.com/p/${code}/embed/captioned/`, embedHeaders());
  if (!response.ok) {
    return null;
  }
  const html = await response.text();
  const init = html.match(/"init",\[\],\[([\s\S]*?)\]\],/)?.[1];
  if (!init) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(init);
  } catch {
    return null;
  }
  const contextJson = isObject(parsed) && typeof parsed.contextJSON === 'string' ? parsed.contextJSON : null;
  if (!contextJson) {
    return null;
  }
  let context: unknown;
  try {
    context = JSON.parse(contextJson);
  } catch {
    return null;
  }
  if (!isObject(context)) {
    return null;
  }
  const embedded = isObject(context.context) && isObject(context.context.media) ? context.context.media : null;
  return embedded ?? gqlShortcodeMedia(context);
}

async function graphqlMedia(code: string): Promise<Json | null> {
  const params = await graphqlParams(code);
  if (!params) {
    return null;
  }
  const body = new URLSearchParams({
    ...params.body,
    av: '0',
    doc_id: '26130443479876713',
    fb_api_caller_class: 'RelayModern',
    fb_api_req_friendly_name: 'PolarisPostRootQuery',
    server_timestamps: 'true',
    variables: JSON.stringify({ shortcode: code }),
  });
  try {
    const response = await fetchText('https://www.instagram.com/graphql/query', {
      ...embedHeaders(),
      ...params.headers,
      'X-FB-Friendly-Name': 'PolarisPostRootQuery',
      'X-Requested-With': 'XMLHttpRequest',
      'content-type': 'application/x-www-form-urlencoded',
      method: 'POST',
      body: body.toString(),
    });
    if (!response.ok) {
      return null;
    }
    const payload = await response.json();
    const data = isObject(payload) && isObject(payload.data) ? payload.data : null;
    return data ? gqlShortcodeMedia(data) : null;
  } catch {
    return null;
  }
}

async function graphqlParams(code: string): Promise<{ body: Record<string, string>; headers: Record<string, string> } | null> {
  const response = await fetchText(`https://www.instagram.com/p/${code}/`, embedHeaders());
  if (!response.ok) {
    return null;
  }
  const html = await response.text();
  const site = entryObject('SiteData', html);
  const polaris = entryObject('PolarisSiteData', html);
  const web = entryObject('DGWWebConfig', html);
  const push = entryObject('InstagramWebPushInfo', html);
  const lsdValue = entryObject('LSD', html)?.token;
  const csrf = entryObject('InstagramSecurityConfig', html)?.csrf_token;

  const lsd = typeof lsdValue === 'string' ? lsdValue : randomToken();
  const cookie = buildCookie(response, {
    csrftoken: typeof csrf === 'string' ? csrf : null,
    dpr: '2',
    ig_did: typeof polaris?.device_id === 'string' ? polaris.device_id : null,
    ig_nrcb: '1',
    mid: typeof polaris?.machine_id === 'string' ? polaris.machine_id : null,
    wd: '1280x720',
  });

  return {
    headers: {
      'X-CSRFToken': typeof csrf === 'string' ? csrf : '',
      'X-FB-LSD': lsd,
      'X-Bloks-Version-Id':
        typeof entryObject('WebBloksVersioningID', html)?.versioningID === 'string'
          ? (entryObject('WebBloksVersioningID', html)?.versioningID as string)
          : '',
      cookie,
      'x-asbd-id': '129477',
      'x-ig-app-id': typeof web?.appId === 'string' ? (web.appId as string) : APP_ID,
    },
    body: {
      __a: '1',
      __ccg: 'EXCELLENT',
      __comet_req: String(queryNumber('__comet_req', html) ?? 7),
      __csr: randomToken(154),
      __d: 'www',
      __dyn: randomToken(154),
      __hs: typeof site?.haste_session === 'string' ? (site.haste_session as string) : '20126.HYP:instagram_web_pkg.2.1...0',
      __hsi: typeof site?.hsi === 'string' ? (site.hsi as string) : '7436540909012459023',
      __req: 'b',
      __rev: typeof push?.rollout_hash === 'string' ? (push.rollout_hash as string) : '1019933358',
      __s: `::${Math.random().toString(36).replace(/\d/g, '').slice(2, 8)}`,
      __spin_b: typeof site?.__spin_b === 'string' ? (site.__spin_b as string) : 'trunk',
      __spin_r: typeof site?.__spin_r === 'string' ? (site.__spin_r as string) : '1019933358',
      __spin_t: String(typeof site?.__spin_t === 'number' ? site.__spin_t : Math.floor(Date.now() / 1000)),
      __user: '0',
      av: '0',
      dpr: '2',
      jazoest: String(queryNumber('jazoest', html) ?? Math.floor(Math.random() * 10000)),
      lsd,
    },
  };
}

function buildCookie(
  response: Response,
  fallback: Record<string, string | null>
): string {
  const raw = response.headers.getSetCookie?.() ?? [];
  const cookies = new Map<string, string>();
  for (const value of raw) {
    const pair = value.split(';', 1)[0]?.trim();
    const separator = pair?.indexOf('=') ?? -1;
    if (pair && separator > 0) {
      cookies.set(pair.slice(0, separator), pair.slice(separator + 1));
    }
  }
  for (const [name, value] of Object.entries(fallback)) {
    if (value && !cookies.has(name)) {
      cookies.set(name, value);
    }
  }
  return [...cookies].map(([name, value]) => `${name}=${value}`).join('; ');
}

function gqlShortcodeMedia(data: Json): Json | null {
  if (!isObject(data)) {
    return null;
  }
  const webInfo = isObject(data.xdt_api__v1__media__shortcode__web_info)
    ? (data.xdt_api__v1__media__shortcode__web_info as Record<string, unknown>)
    : null;
  const webItems = webInfo && Array.isArray(webInfo.items) ? (webInfo.items as unknown[]) : [];
  const webMedia = webItems[0];
  if (isObject(webMedia)) {
    return webMedia;
  }
  if (isObject(data.gql_data)) {
    const gql = data.gql_data;
    const media = gql.shortcode_media ?? gql.xdt_shortcode_media;
    if (isObject(media)) {
      return media;
    }
  }
  const direct = data.shortcode_media ?? data.xdt_shortcode_media;
  return isObject(direct) ? direct : null;
}

interface MediaItem {
  kind: 'video' | 'image';
  url: string;
}

function mediaItems(media: Json, code: string): MediaItem[] {
  if (!isObject(media)) {
    return [];
  }
  const sidecar =
    isObject(media.edge_sidecar_to_children) && Array.isArray(media.edge_sidecar_to_children.edges)
      ? (media.edge_sidecar_to_children.edges as unknown[])
      : [];
  const oldItems = sidecar.flatMap((edge, index) => {
    const node = isObject(edge) && isObject(edge.node) ? edge.node : null;
    return node ? instagramItem(node, index + 1) : [];
  });
  if (oldItems.length > 0) {
    return oldItems;
  }
  const carousel = Array.isArray(media.carousel_media) ? (media.carousel_media as unknown[]).filter(isObject) : [];
  const newItems = carousel.flatMap((item, index) => instagramItem(item, index + 1));
  if (newItems.length > 0) {
    return newItems;
  }
  return instagramItem(media, null);
}

function instagramItem(media: Record<string, unknown>, index: number | null): MediaItem[] {
  const versions = Array.isArray(media.video_versions) ? (media.video_versions as unknown[]).filter(isObject) : [];
  const selected = selectVersion(media.video_versions);
  const directUrl = typeof media.video_url === 'string' ? media.video_url : null;
  const video = selected ?? directUrl;
  if (video || versions.length > 0) {
    const urls: string[] = [];
    const seen = new Set<string>();
    const add = (url: string | null) => {
      if (url && !seen.has(url)) {
        seen.add(url);
        urls.push(url);
      }
    };
    add(directUrl);
    add(selected);
    for (const v of versions) {
      add(isObject(v) && typeof v.url === 'string' ? v.url : null);
    }
    return urls.map((url) => ({ kind: 'video' as const, url }));
  }
  const image = selectImage(media);
  return image ? [{ kind: 'image', url: image }] : [];
}

function selectImage(media: Record<string, unknown>): string | null {
  const imageVersions =
    isObject(media.image_versions2) && Array.isArray(media.image_versions2.candidates)
      ? (media.image_versions2.candidates as unknown[]).filter(isObject)
      : [];
  const first = imageVersions[0];
  return first && typeof first.url === 'string' ? first.url : typeof media.display_url === 'string' ? media.display_url : null;
}

function selectVersion(value: unknown): string | null {
  const versions = Array.isArray(value) ? (value as unknown[]).filter(isObject) : [];
  let best: Record<string, unknown> | null = null;
  for (const candidate of versions) {
    const width = typeof candidate.width === 'number' ? candidate.width : null;
    if (width === null) {
      continue;
    }
    if (best === null) {
      best = candidate;
      continue;
    }
    const bestWidth = typeof best.width === 'number' ? best.width : Infinity;
    if (Math.abs(width - PREFERRED_WIDTH) < Math.abs(bestWidth - PREFERRED_WIDTH)) {
      best = candidate;
    }
  }
  const selected = best ?? versions[0] ?? null;
  return selected && typeof selected.url === 'string' ? selected.url : null;
}

function entryObject(name: string, html: string): Record<string, unknown> | null {
  const raw = html.match(new RegExp(`\\\\["${name}",.*?,({.*?}),\\\\d+\\\\]`))?.[1];
  if (!raw) {
    return null;
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  return isObject(parsed) ? parsed : null;
}

function queryNumber(name: string, html: string): number | null {
  const raw = html.match(new RegExp(`${name}=(\\d+)`))?.[1];
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

function metadataTitle(media: Json): string {
  if (!isObject(media)) {
    return 'Instagram Video';
  }
  if (typeof media.caption === 'string' && media.caption) {
    return media.caption.slice(0, 80);
  }
  if (isObject(media.caption) && typeof media.caption.text === 'string') {
    return media.caption.text.slice(0, 80);
  }
  if (isObject(media.edge_media_to_caption) && Array.isArray(media.edge_media_to_caption.edges)) {
    const first = (media.edge_media_to_caption.edges as unknown[])[0];
    const node = isObject(first) && isObject(first.node) ? first.node : null;
    if (node && typeof node.text === 'string') {
      return node.text.slice(0, 80);
    }
  }
  const user = metadataUser(media);
  return `Instagram ${user ? `by ${user}` : 'Video'}`;
}

function metadataDuration(media: Json): number {
  if (!isObject(media)) {
    return 0;
  }
  if (typeof media.video_duration === 'number') {
    return Math.round(media.video_duration);
  }
  if (typeof media.video_duration === 'string') {
    const parsed = parseFloat(media.video_duration);
    return Number.isFinite(parsed) ? Math.round(parsed) : 0;
  }
  return 0;
}

function metadataUser(media: Json): string | null {
  if (!isObject(media)) {
    return null;
  }
  const user = isObject(media.user) ? media.user : isObject(media.owner) ? media.owner : null;
  if (user) {
    if (typeof user.username === 'string') {
      return user.username;
    }
    if (typeof user.full_name === 'string') {
      return user.full_name;
    }
  }
  return null;
}

function metadataUploader(media: Json): string {
  return metadataUser(media) ?? 'Instagram';
}

async function classifyUnavailable(code: string): Promise<InstagramScraperError> {
  const url = new URL('https://i.instagram.com/api/v1/oembed/');
  url.searchParams.set('url', `https://www.instagram.com/p/${code}/`);
  let status = 0;
  let body = '';
  try {
    const response = await fetchText(url.href, mobileHeaders(), 10000);
    status = response.status;
    body = await response.text();
  } catch {
    status = 0;
  }
  return unavailableError(status, body);
}

function unavailableError(status: number, body: string): InstagramScraperError {
  if (status === 404) {
    return new InstagramScraperError('notFound', 'Instagram post not found or removed');
  }
  if (status === 429) {
    return new InstagramScraperError('rateLimited', 'Instagram is rate-limiting this IP');
  }
  if (/MIN_AGE_ACCOUNT|under 18/i.test(body)) {
    return new InstagramScraperError('ageRestricted', 'This Instagram content is age-restricted');
  }
  if (/private account|"is_private":\s*true|account is private/i.test(body)) {
    return new InstagramScraperError('private', 'This Instagram account is private');
  }
  if (/log in|login_required|not logged/i.test(body)) {
    return new InstagramScraperError('loginRequired', 'Instagram requires login for this content');
  }
  return new InstagramScraperError('unavailable', `Instagram post unavailable (oembed ${status || 'unreachable'})`);
}

export async function downloadWithHeaders(url: string): Promise<Response> {
  return fetch(url, {
    headers: {
      'Referer': 'https://www.instagram.com/',
      'User-Agent': browserFingerprint().userAgent,
    },
    redirect: 'follow',
  });
}