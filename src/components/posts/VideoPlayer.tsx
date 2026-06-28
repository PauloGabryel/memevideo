import { useState } from 'react';
import { Play, ExternalLink } from 'lucide-react';
import { getVideoEmbedUrl, isVideoUrl, isYouTubeUrl, isVimeoUrl } from '@/lib/utils';

interface VideoPlayerProps {
  url: string;
  thumbnail?: string | null;
  title?: string;
}

export function VideoPlayer({ url, thumbnail, title }: VideoPlayerProps) {
  const [playing, setPlaying] = useState(false);

  const normalizedUrl = url.trim();
  const isDirectVideo = isVideoUrl(normalizedUrl);
  const isYT = isYouTubeUrl(normalizedUrl);
  const isVimeo = isVimeoUrl(normalizedUrl);
  const isTikTok = /tiktok\.com|vm\.tiktok\.com/i.test(normalizedUrl);
  const isEmbed = isYT || isVimeo || isTikTok;

  const embedUrl = isEmbed ? getVideoEmbedUrl(url) : url;

  if (isDirectVideo) {
    return (
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        <video
          src={url}
          controls
          playsInline
          poster={thumbnail || undefined}
          className="w-full h-full object-contain"
          title={title}
          preload="metadata"
        />
      </div>
    );
  }

  if (isEmbed) {
    if (!playing && thumbnail) {
      return (
        <div
          className="relative w-full aspect-video bg-black rounded-lg overflow-hidden cursor-pointer group"
          onClick={() => setPlaying(true)}
        >
          <img
            src={thumbnail}
            alt={title || 'Video thumbnail'}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/40 transition-colors">
            <div className="bg-[#7c3aed] rounded-full p-4 shadow-2xl transform group-hover:scale-110 transition-transform">
              <Play className="h-8 w-8 text-white fill-white" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative w-full aspect-video rounded-lg overflow-hidden">
        <iframe
          src={playing ? `${embedUrl}&autoplay=1` : embedUrl}
          title={title || 'Video'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="w-full h-full border-0"
        />
      </div>
    );
  }

  if (isDirectVideo) {
    return (
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden">
        <video
          src={url}
          controls
          playsInline
          poster={thumbnail || undefined}
          className="w-full h-full object-contain"
          title={title}
          preload="metadata"
        />
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
      {thumbnail && (
        <img
          src={thumbnail}
          alt={title || 'thumbnail'}
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        />
      )}
      <div className="relative z-10 text-center p-4">
        <ExternalLink className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm text-muted-foreground mb-3">Vídeo externo</p>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[#7c3aed] text-sm font-medium hover:underline"
        >
          Abrir vídeo
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}
