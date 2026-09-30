import { useEffect, useRef, useState } from 'react';
import { Game } from './game/engine';
import { LEVELS } from './game/levels';
import { initAudio } from './game/audio';

const SAVE_KEY = 'hotline-superhot-save';

interface Save { unlocked: number; best: Record<number, number>; }

function loadSave(): Save {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || '');
    if (s && typeof s.unlocked === 'number') return s;
  } catch { /* ignore */ }
  return { unlocked: 1, best: {} };
}

function GameView({ level, onExit, onDone }: { level: number; onExit: () => void; onDone: (l: number, s: number) => void }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const cbs = useRef({ onExit, onDone });
  cbs.current = { onExit, onDone };
  useEffect(() => {
    const g = new Game(ref.current!, level, {
      onQuit: () => cbs.current.onExit(),
      onLevelComplete: (l, s) => cbs.current.onDone(l, s),
    });
    return () => g.destroy();
  }, [level]);
  return <canvas ref={ref} className="fixed inset-0 block" style={{ cursor: 'none' }} />;
}

function Shards() {
  // decorative red crystal shards floating in menu
  const items = Array.from({ length: 22 }, (_, i) => i);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {items.map((i) => {
        const left = (i * 37) % 100;
        const top = (i * 53) % 100;
        const size = 8 + ((i * 7) % 26);
        const rot = (i * 47) % 360;
        return (
          <div
            key={i}
            className="absolute animate-[float_7s_ease-in-out_infinite]"
            style={{
              left: `${left}%`,
              top: `${top}%`,
              width: size,
              height: size,
              transform: `rotate(${rot}deg)`,
              animationDelay: `${-i * 0.7}s`,
              clipPath: 'polygon(50% 0%, 100% 70%, 20% 100%)',
              background: i % 3 === 0 ? '#111' : 'linear-gradient(135deg,#ff6152,#c00a14)',
              opacity: 0.8,
            }}
          />
        );
      })}
    </div>
  );
}

export default function App() {
  const [save, setSave] = useState<Save>(loadSave);
  const [playing, setPlaying] = useState<number | null>(null);
  const [sel, setSel] = useState(0);

  const persist = (s: Save) => {
    setSave(s);
    localStorage.setItem(SAVE_KEY, JSON.stringify(s));
  };

  const onDone = (l: number, score: number) => {
    const s = loadSave();
    s.unlocked = Math.max(s.unlocked, Math.min(LEVELS.length, l + 2));
    s.best[l] = Math.max(s.best[l] || 0, score);
    persist(s);
  };

  useEffect(() => {
    if (playing !== null) return;
    const k = (e: KeyboardEvent) => {
      if (e.code === 'ArrowDown' || e.code === 'KeyS') setSel((v) => Math.min(save.unlocked - 1, v + 1));
      if (e.code === 'ArrowUp' || e.code === 'KeyW') setSel((v) => Math.max(0, v - 1));
      if (e.code === 'Enter' || e.code === 'Space') { initAudio(); setPlaying(sel); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [playing, sel, save.unlocked]);

  if (playing !== null) {
    return <GameView level={playing} onExit={() => { setSave(loadSave()); setPlaying(null); }} onDone={onDone} />;
  }

  const totalBest = Object.values(save.best).reduce((a, b) => a + b, 0);

  return (
    <div className="relative h-screen w-full overflow-y-auto overflow-x-hidden bg-[#f1f1f3] text-[#111] select-none" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
      <style>{`
        @keyframes float { 0%,100% { translate: 0 0; } 50% { translate: 0 -18px; } }
        @keyframes glitch { 0%,92%,100% { transform: translate(0,0) skewX(0); } 93% { transform: translate(-4px,2px) skewX(-8deg); } 95% { transform: translate(5px,-2px) skewX(6deg); } 97% { transform: translate(-2px,0) skewX(0); } }
        @keyframes pulseRed { 0%,100% { opacity: 1 } 50% { opacity: .55 } }
      `}</style>
      {/* floor grid */}
      <div className="absolute inset-0 opacity-60" style={{ backgroundImage: 'linear-gradient(rgba(0,0,0,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.05) 1px, transparent 1px)', backgroundSize: '64px 64px' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(40,40,55,.25))' }} />
      <Shards />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-10 px-8 py-12 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl">
          <div className="mb-3 text-sm font-bold tracking-[0.5em] text-[#e0141e]">TOP-DOWN // ONE HIT KILLS</div>
          <h1 className="leading-[0.85]" style={{ fontFamily: 'Anton, Impact, sans-serif', animation: 'glitch 4s infinite' }}>
            <span className="block text-[110px] text-[#111] md:text-[150px]" style={{ textShadow: '6px 6px 0 #e0141e' }}>HOT</span>
            <span className="block text-[110px] text-[#e0141e] md:text-[150px]" style={{ textShadow: '6px 6px 0 #111' }}>//LINE</span>
          </h1>
          <p className="mt-6 max-w-md text-lg font-medium leading-snug text-neutral-600">
            Dunia putih. Musuh kristal merah. Satu pukulan, kamu mati. Satu pukulan, mereka hancur.
            Dobrak pintu, lempar senjata, eksekusi yang jatuh — <span className="font-bold text-[#e0141e]">bersihkan lantai.</span>
          </p>

          <div className="mt-8 grid max-w-md grid-cols-2 gap-x-6 gap-y-2 text-[15px] font-semibold">
            {[
              ['WASD', 'Gerak'],
              ['KLIK x4', 'Combo: Jab-Cross-Hook-Spin Kick'],
              ['F / E', 'Tendang (musuh terpental)'],
              ['TAHAN RODA / C', 'Slow motion (FOCUS)'],
              ['SPASI', 'Sandera / lempar / sprint / finish'],
              ['KLIK KANAN', 'Lempar / Ambil senjata'],
              ['T', 'Mode SUPERHOT (waktu)'],
              ['N', 'Matikan semua slow-mo'],
              ['R / ESC', 'Restart / Pause'],
            ].map(([k, v]) => (
              <div key={k} className="flex items-center gap-3">
                <span className="min-w-[110px] bg-[#111] px-2 py-0.5 text-center text-xs tracking-widest text-white">{k}</span>
                <span className="text-neutral-700">{v}</span>
              </div>
            ))}
          </div>
          <div className="mt-6 max-w-md border-l-4 border-[#e0141e] pl-3 text-sm font-semibold text-neutral-600">
            TIPS: SPASI dekat musuh berdiri untuk menyandera dan memakai tubuhnya sebagai perisai; SPASI lagi melemparnya. SPASI tanpa target = sprint cepat. N mematikan semua bullet-time dan slow-mo.
          </div>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-3 flex items-end justify-between">
            <div className="text-3xl tracking-wide" style={{ fontFamily: 'Anton, Impact, sans-serif' }}>SELECT FLOOR</div>
            <div className="text-xs font-bold tracking-widest text-neutral-500">TOTAL {totalBest} PTS</div>
          </div>
          <div className="flex flex-col gap-2">
            {LEVELS.map((l, i) => {
              const locked = i >= save.unlocked;
              const active = sel === i;
              return (
                <button
                  key={l.name}
                  disabled={locked}
                  onMouseEnter={() => !locked && setSel(i)}
                  onClick={() => { initAudio(); setPlaying(i); }}
                  className={`group relative flex items-center justify-between overflow-hidden border-2 px-4 py-3 text-left transition-all duration-150 ${
                    locked
                      ? 'cursor-not-allowed border-neutral-300 bg-neutral-200/60 text-neutral-400'
                      : active
                      ? 'translate-x-2 border-[#111] bg-[#e0141e] text-white shadow-[6px_6px_0_#111]'
                      : 'border-[#111] bg-white text-[#111] hover:bg-neutral-50'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold tracking-[0.3em] opacity-70">LEVEL {String(i + 1).padStart(2, '0')}</div>
                    <div className="text-3xl leading-none" style={{ fontFamily: 'Anton, Impact, sans-serif' }}>{locked ? '██████' : l.name}</div>
                    <div className="mt-1 text-xs font-bold tracking-wider opacity-70">{locked ? 'LOCKED' : l.sub}</div>
                  </div>
                  <div className="text-right text-sm font-bold">
                    {save.best[i] ? <div>{save.best[i]}<div className="text-[10px] opacity-70">BEST</div></div> : locked ? '🔒' : <span style={{ animation: 'pulseRed 1.2s infinite' }}>▶</span>}
                  </div>
                </button>
              );
            })}
          </div>
          <button
            onClick={() => { initAudio(); setPlaying(sel); }}
            className="mt-5 w-full bg-[#111] py-4 text-3xl tracking-widest text-white shadow-[6px_6px_0_#e0141e] transition-transform hover:-translate-y-0.5 active:translate-y-0.5"
            style={{ fontFamily: 'Anton, Impact, sans-serif' }}
          >
            START
          </button>
          <div className="mt-3 text-center text-xs font-bold tracking-[0.3em] text-neutral-500">ENTER UNTUK MULAI</div>
        </div>
      </div>
    </div>
  );
}
