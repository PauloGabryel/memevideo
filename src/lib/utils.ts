import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'agora';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days < 7) return `${days}d`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getVideoEmbedUrl(url: string): string {
  // YouTube
  const youtubeMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\s?]+)/
  );
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=0&rel=0`;
  }

  // YouTube Shorts
  const shortsMatch = url.match(/youtube\.com\/shorts\/([^&\s?]+)/);
  if (shortsMatch) {
    return `https://www.youtube.com/embed/${shortsMatch[1]}?autoplay=0&rel=0`;
  }

  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  // TikTok
  const tiktokMatch = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/);
  if (tiktokMatch) {
    return `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`;
  }

  const tiktokShortMatch = url.match(/vm\.tiktok\.com\/[A-Za-z0-9]+/);
  if (tiktokShortMatch) {
    return `https://www.tiktok.com/embed/${encodeURIComponent(url)}`;
  }

  return url;
}

function normalizeVideoUrl(url: string): string {
  return url.trim();
}

function hasVideoExtension(url: string): boolean {
  const videoExtensionRegex = /\.(mp4|webm|ogg|mov|avi|mkv|m4v|3gp|mpg|mpeg)(?:[/?#].*)?$/i;
  return videoExtensionRegex.test(url);
}

export function isVideoUrl(url: string): boolean {
  const normalized = normalizeVideoUrl(url);
  if (!normalized) return false;

  if (hasVideoExtension(normalized)) {
    return true;
  }

  try {
    const parsed = new URL(normalized);
    if (hasVideoExtension(parsed.pathname)) {
      return true;
    }
    return hasVideoExtension(decodeURIComponent(parsed.pathname));
  } catch {
    try {
      return hasVideoExtension(decodeURIComponent(normalized));
    } catch {
      return false;
    }
  }
}

export function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)/i.test(url);
}

export function isVimeoUrl(url: string): boolean {
  return /vimeo\.com/i.test(url);
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

export function generateUsername(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .slice(0, 20);
}

export function isAuthError(err: any): boolean {
  if (!err) return false;
  const status = err?.status || err?.statusCode || err?.status_code || (err?.error && err.error.status);
  if (status === 401 || status === 403 || status === 400) return true;
  const msg = (err?.message || err?.error || '').toString().toLowerCase();
  if (/invalid|token|refresh|jwt|forbidden|permission|unauthor/i.test(msg)) return true;
  return false;
}
