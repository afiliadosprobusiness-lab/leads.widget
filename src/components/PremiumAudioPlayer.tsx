import { type MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, Volume2, VolumeX } from "lucide-react";

type PremiumAudioPlayerProps = {
  src: string;
  theme?: "light" | "dark";
  className?: string;
  label?: string;
};

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

export function PremiumAudioPlayer({
  src,
  theme = "dark",
  className = "",
  label = "Audio response",
}: PremiumAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loaded, setLoaded] = useState(false);

  const isLight = theme === "light";
  const progress = useMemo(() => {
    if (!duration || !Number.isFinite(duration)) return 0;
    return Math.min(100, Math.max(0, (currentTime / duration) * 100));
  }, [currentTime, duration]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoaded = () => {
      setDuration(audio.duration || 0);
      setLoaded(true);
    };
    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime || 0);
    };
    const handleEnded = () => {
      setPlaying(false);
      setCurrentTime(audio.duration || 0);
    };
    const handlePause = () => {
      setPlaying(false);
    };
    const handlePlay = () => {
      setPlaying(true);
    };

    audio.addEventListener("loadedmetadata", handleLoaded);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("play", handlePlay);

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoaded);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("play", handlePlay);
    };
  }, [src]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    try {
      if (audio.paused) {
        await audio.play();
      } else {
        audio.pause();
      }
    } catch {
      // noop
    }
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    const nextMuted = !audio.muted;
    audio.muted = nextMuted;
    setMuted(nextMuted);
  };

  const seekTo = (event: MouseEvent<HTMLButtonElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    const ratio = Math.min(1, Math.max(0, relativeX / Math.max(rect.width, 1)));
    audio.currentTime = ratio * duration;
    setCurrentTime(audio.currentTime);
  };

  return (
    <div
      className={`w-full min-w-[220px] max-w-[320px] rounded-2xl border px-3 py-2.5 shadow-[0_10px_30px_-20px_rgba(15,23,42,0.9)] backdrop-blur ${isLight ? "border-slate-200 bg-white/95 text-slate-700" : "border-white/15 bg-slate-900/70 text-slate-100"} ${className}`}
    >
      <audio ref={audioRef} src={src} preload="metadata" />
      <div className="mb-1.5 flex items-center justify-between text-[11px]">
        <span className={`inline-flex items-center gap-1.5 font-medium ${isLight ? "text-slate-600" : "text-slate-200/90"}`}>
          <span className={`h-2 w-2 rounded-full ${playing ? "animate-pulse" : ""} ${isLight ? "bg-emerald-500" : "bg-emerald-300"}`} />
          {label}
        </span>
        <span className={`${isLight ? "text-slate-500" : "text-slate-300/80"}`}>
          {formatTime(currentTime)} / {loaded ? formatTime(duration) : "--:--"}
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={togglePlay}
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 ${isLight ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-400" : "border-white/20 bg-white/5 text-white hover:bg-white/10 focus-visible:ring-cyan-300"}`}
          aria-label={playing ? "Pause audio" : "Play audio"}
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 translate-x-[1px]" />}
        </button>

        <button
          type="button"
          onClick={seekTo}
          className={`relative h-2.5 flex-1 overflow-hidden rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 ${isLight ? "border-slate-300 bg-slate-100 focus-visible:ring-slate-400" : "border-white/20 bg-white/10 focus-visible:ring-cyan-300"}`}
          aria-label="Seek audio timeline"
        >
          <span
            className={`absolute inset-y-0 left-0 rounded-full ${isLight ? "bg-gradient-to-r from-slate-700 to-sky-500" : "bg-gradient-to-r from-cyan-300 to-emerald-300"}`}
            style={{ width: `${progress}%` }}
          />
        </button>

        <button
          type="button"
          onClick={toggleMute}
          className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 ${isLight ? "border-slate-300 bg-white text-slate-700 hover:bg-slate-100 focus-visible:ring-slate-400" : "border-white/20 bg-white/5 text-white hover:bg-white/10 focus-visible:ring-cyan-300"}`}
          aria-label={muted ? "Unmute audio" : "Mute audio"}
        >
          {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}
