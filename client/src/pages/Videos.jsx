import { useEffect, useState } from 'react';
import api from '../services/api';
import { useSettings } from '../hooks/useSettings.jsx';
import { Loader, EmptyState } from '../components/States.jsx';

export default function Videos() {
  const { settings } = useSettings();
  const [videos, setVideos] = useState(null);
  const [playingId, setPlayingId] = useState(null);

  useEffect(() => {
    api.get('/videos').then((r) => setVideos(r.data.videos)).catch(() => setVideos([]));
  }, []);

  return (
    <div className="section py-14 md:py-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pb-6 border-b border-rule">
        <div>
          <p className="text-xs uppercase tracking-widest text-ochre-dark font-medium mb-1">
            Studio Reels & Timelapses
          </p>
          <h1 className="text-4xl sm:text-5xl font-display mb-2">Videos & Process</h1>
          <p className="text-ink/65 text-sm sm:text-base">
            Watch complete painting sessions, canvas preparation, and behind-the-scenes studio moments.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          {settings?.youtube_url && (
            <a
              href={settings.youtube_url}
              target="_blank"
              rel="noreferrer"
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <span>▶</span> Subscribe on YouTube
            </a>
          )}
          {settings?.instagram_url && (
            <a
              href={settings.instagram_url}
              target="_blank"
              rel="noreferrer"
              className="btn-outline text-xs flex items-center gap-1.5"
            >
              <span>📷</span> Follow Reels on Instagram
            </a>
          )}
        </div>
      </div>

      {videos === null ? (
        <Loader />
      ) : videos.length === 0 ? (
        <EmptyState
          title="No videos posted yet."
          description="Studio timelapses and creation videos will appear here soon."
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {videos.map((v) => {
            const isPlaying = playingId === v.id;
            return (
              <div key={v.id} className="border border-rule bg-card overflow-hidden flex flex-col justify-between">
                <div className="aspect-video w-full relative bg-ink overflow-hidden group">
                  {isPlaying ? (
                    <iframe
                      className="w-full h-full"
                      src={`https://www.youtube.com/embed/${v.youtube_video_id}?autoplay=1`}
                      title={v.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPlayingId(v.id)}
                      className="w-full h-full relative block text-left group"
                      aria-label={`Play video: ${v.title}`}
                    >
                      <img
                        src={`https://img.youtube.com/vi/${v.youtube_video_id}/hqdefault.jpg`}
                        alt={v.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-ink/30 group-hover:bg-ink/15 transition-colors flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-paper/90 text-ink shadow-lg flex items-center justify-center pl-1 group-hover:scale-110 transition-transform">
                          <svg className="w-6 h-6 fill-current text-ink" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                      {v.featured && (
                        <span className="absolute top-2 left-2 bg-ochre-dark text-paper text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 shadow-sm">
                          Featured
                        </span>
                      )}
                    </button>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h2 className="font-display text-lg font-medium text-ink leading-snug">
                      {v.title}
                    </h2>
                    {v.description && (
                      <p className="text-xs text-ink/70 mt-1 leading-relaxed line-clamp-3">
                        {v.description}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-rule/50 flex justify-between items-center text-xs">
                    {!isPlaying ? (
                      <button
                        onClick={() => setPlayingId(v.id)}
                        className="text-ochre-dark font-semibold hover:underline"
                      >
                        Play Video ▶
                      </button>
                    ) : (
                      <button
                        onClick={() => setPlayingId(null)}
                        className="text-ink/60 hover:underline"
                      >
                        Close Player ✕
                      </button>
                    )}

                    <a
                      href={`https://www.youtube.com/watch?v=${v.youtube_video_id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-ink/50 hover:text-ink text-[11px]"
                    >
                      Open in YouTube ↗
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
