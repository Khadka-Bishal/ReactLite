//this page demos my mini react working in the browser; the goal is learning-by-building, not shipping a full player

import { ReactLite } from "./reactlite/element.js";
import { useState } from "./reactlite/hooks.js";
import { createResource } from "./reactlite/resource.js";

//----itunes-powered playlist----
const ITUNES_BASE = "https://itunes.apple.com/search";
const queries = [
  "Coldplay Viva La Vida",
  "Radiohead Everything In Its Right Place",
  "The Smiths There Is A Light That Never Goes Out",
  "Eagles Hotel California",
];

//this fetches one preview per query and normalizes fields we use in the ui
const getPlaylist = async () => {
  const results = [];
  for (const term of queries) {
    const url = `${ITUNES_BASE}?media=music&entity=song&limit=1&term=${encodeURIComponent(
      term
    )}`;
    const r = await fetch(url);
    const j = await r.json();
    const it = j.results?.[0];
    if (!it) continue;

    //upgrade cover to higher-res if available
    const cover = (it.artworkUrl100 || "").replace("100x100bb", "300x300bb");

    results.push({
      id: String(it.trackId ?? it.collectionId ?? it.artistId ?? term),
      title: it.trackName || "Unknown Title",
      artist: it.artistName || "Unknown Artist",
      cover: cover || it.artworkUrl100,
      src: it.previewUrl, //30s official preview
    });
  }
  return results;
};

export default function App() {
  //suspense-style data access; throws a promise until ready
  const tracks = createResource(getPlaylist, "playlist");

  //keep currently selected and play/pause state local to this component
  const firstId = tracks[0]?.id;
  const [selectedId, setSelectedId] = useState(firstId);
  const [playing, setPlaying] = useState(false);

  //resolve what we consider “current” track
  const current =
    tracks.find((t) => t.id === (selectedId ?? firstId)) || tracks[0];

  //update selected and auto-start playback for user feedback
  const onSelect = (id) => {
    setSelectedId(id);
    setPlaying(true);
  };

  //advance to next track and wrap at end
  const playNext = () => {
    const i = tracks.findIndex((t) => t.id === (selectedId ?? firstId));
    const next = tracks[(i + 1) % tracks.length];
    onSelect(next.id);
  };

  //play/pause using a single hidden audio element anchored on window
  const togglePlay = async () => {
    const a = window._reactliteAudio;
    if (!a) return;
    try {
      if (a.paused) {
        await a.play(); //await ensures state flips after audio actually starts
        setPlaying(true);
      } else {
        a.pause();
        setPlaying(false);
      }
    } catch (err) {
      //console.warn(err)
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur p-6">
        {/* header */}
        <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between mb-3 gap-1">
          <h1 className="text-xl font-semibold">🎧 Mini Music Player</h1>
          <p className="text-xs text-yellow-500">
            built on my mini react (
            <span className="text-emerald-100">ReactLite</span>)
          </p>
        </div>

        {/* now playing */}
        <div className="grid md:grid-cols-[160px_1fr] gap-5 items-center">
          <img
            className="w-40 h-40 rounded-xl object-cover ring-1 ring-white/10"
            src={current.cover}
            alt={current.title}
          />
          <div className="space-y-2">
            <div className="text-lg font-semibold">{current.title}</div>
            <div className="text-slate-400 text-sm">{current.artist}</div>

            <div className="flex gap-2 pt-2">
              <button
                className={
                  "px-3 py-2 rounded-lg border border-white/10 transition " +
                  (playing
                    ? "bg-emerald-600/20 border-emerald-400/40"
                    : "bg-slate-800 hover:border-white/20")
                }
                onclick={togglePlay} //our element system maps onclick correctly
                title={playing ? "Pause" : "Play"}
              >
                {playing ? "⏸ Pause" : "▶️ Play"}
              </button>

              <button
                className="px-3 py-2 rounded-lg border border-white/10 bg-slate-800 hover:border-white/20"
                onclick={playNext}
                title="Next"
              >
                ⏭ Next
              </button>
            </div>
          </div>
        </div>

        {/* playlist */}
        <div className="grid md:grid-cols-2 gap-3 mt-6">
          {tracks.map((t) => (
            <button
              className={
                "group grid grid-cols-[56px_1fr] items-center gap-3 p-2 rounded-xl border text-left transition " +
                (t.id === current.id
                  ? "border-emerald-400/40 bg-emerald-500/10"
                  : "border-white/10 hover:border-white/20 bg-slate-900")
              }
              onclick={() => onSelect(t.id)}
              title={"Play " + t.title}
            >
              <img
                className="w-14 h-14 rounded-lg object-cover ring-1 ring-white/10"
                src={t.cover}
                alt={t.title}
              />
              <div>
                <div className="font-medium">{t.title}</div>
                <div className="text-slate-400 text-xs">{t.artist}</div>
              </div>
            </button>
          ))}
        </div>

        {/* hidden audio keeps logic simple while ui stays custom */}
        <audio
          style={{ display: "none" }}
          src={current?.src || ""} //safe if track missing a preview
          preload="auto"
          onloadedmetadata={(e) => (window._reactliteAudio = e.target)} //stash handle for controls
          onplay={() => setPlaying(true)}
          onpause={() => setPlaying(false)}
          onended={playNext}
          autoplay={playing ? true : null} //only auto when we explicitly set playing
        />
      </div>
    </div>
  );
}
