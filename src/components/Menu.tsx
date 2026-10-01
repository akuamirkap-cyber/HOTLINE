import { useEffect, useState } from 'react';
import { LEVELS } from '../game/levels';
import { Floorplan } from './Floorplan';
import { Icon } from './Icon';
import '../menu.css';

interface MenuProps {
  unlocked: number;
  best: Record<number, number>;
  selected: number;
  onSelect: (level: number) => void;
  onStart: () => void;
  onGuide: () => void;
  mobileControls: boolean;
  touchDevice: boolean;
  onToggleControls: () => void;
}

const formatScore = (score: number) => Math.floor(score).toString().padStart(6, '0');

export function Menu({ unlocked, best, selected, onSelect, onStart, onGuide, mobileControls, touchDevice, onToggleControls }: MenuProps) {
  const [fullscreen, setFullscreen] = useState(!!document.fullscreenElement);
  const [notice, setNotice] = useState('');
  const level = LEVELS[selected];
  const totalBest = Object.values(best).reduce((sum, score) => sum + score, 0);

  useEffect(() => {
    const onFullscreenChange = () => setFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const toggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (document.fullscreenEnabled) await document.documentElement.requestFullscreen();
      else setNotice('Mode layar penuh tidak tersedia di browser ini.');
    } catch {
      setNotice('Browser membatasi mode layar penuh. Buka preview di tab baru untuk mencoba.');
    }
  };

  return (
    <div className="menu-page">
      <header className="menu-header menu-container">
        <div className="brand" aria-label="HOTLINE">
          <span className="brand-symbol" aria-hidden="true"><i /><i /></span>
          <span>HOTLINE<span className="brand-period">.</span></span>
        </div>
        <span className="header-motto">DON'T BLINK.</span>
        <nav className="menu-nav" aria-label="Menu game">
          <button className={`menu-mobile-toggle${mobileControls ? ' is-enabled' : ''}`} type="button" onClick={onToggleControls} aria-pressed={mobileControls} aria-label={mobileControls ? 'Sembunyikan tombol mobile' : 'Perlihatkan tombol mobile'} title={mobileControls ? 'Sembunyikan tombol mobile' : 'Perlihatkan tombol mobile'}><Icon name="device" size={17} /><span>{mobileControls ? 'Mobile aktif' : 'PERLIHATKAN TOMBOL MOBILE'}</span></button>
          <button className="guide-button" type="button" onClick={onGuide} aria-haspopup="dialog">
            <Icon name="keyboard" size={18} />
            <span>Panduan</span>
            <kbd>?</kbd>
          </button>
          <span className="nav-divider" aria-hidden="true" />
          <button className="icon-button fullscreen-button" type="button" onClick={toggleFullscreen} aria-label={fullscreen ? 'Keluar layar penuh' : 'Layar penuh'} title={fullscreen ? 'Keluar layar penuh' : 'Layar penuh'}>
            <Icon name={fullscreen ? 'collapse' : 'expand'} size={19} />
          </button>
        </nav>
      </header>

      <main className="menu-main menu-container">
        <section className="hero" aria-labelledby="game-title">
          <div className="eyebrow hero-overline"><span className="overline-mark" /> TOP-DOWN TACTICAL ACTION</div>
          <h1 className="hero-title" id="game-title" aria-label="HOT LINE">
            <span className="title-line">HOT</span>
            <span className="title-line"><span className="title-slashes">//</span>LINE<span className="title-stop">.</span></span>
          </h1>
          <div className="hero-copy">
            <p className="hero-tagline">Satu pukulan. <span>Tak ada kesempatan kedua.</span></p>
            <p className="hero-description">Dobrak pintu. Rebut senjata. Bersihkan lantai.</p>
          </div>
          <Floorplan level={level} index={selected} />
        </section>

        <section className="mission-panel" aria-labelledby="mission-title">
          <header className="mission-heading">
            <div>
              <p className="eyebrow">SELECT FLOOR</p>
              <h2 id="mission-title">Pilih lantai.</h2>
            </div>
            <div className="mission-progress" aria-label={`${unlocked} dari ${LEVELS.length} lantai terbuka`}>
              <div className="progress-count"><strong>{String(unlocked).padStart(2, '0')}</strong><span> / {String(LEVELS.length).padStart(2, '0')}</span></div>
              <div className="progress-bars" aria-hidden="true">
                {LEVELS.map((_, index) => <i key={index} className={index < unlocked ? 'is-unlocked' : ''} />)}
              </div>
            </div>
          </header>

          <ol className="level-list" aria-label="Daftar lantai">
            {LEVELS.map((floor, index) => {
              const locked = index >= unlocked;
              const active = index === selected;
              return (
                <li key={floor.name}>
                  <button
                    type="button"
                    className={`level-option${active ? ' is-selected' : ''}${locked ? ' is-locked' : ''}`}
                    disabled={locked}
                    aria-pressed={active}
                    aria-label={`Level ${index + 1}: ${floor.name}${locked ? ', terkunci' : ''}`}
                    onClick={() => onSelect(index)}
                  >
                    <span className="level-index">{String(index + 1).padStart(2, '0')}</span>
                    <span className="level-information">
                      <span className="level-name">{floor.name}</span>
                      <span className="level-subtitle">{locked ? `SELESAIKAN ${LEVELS[index - 1].name}` : floor.sub}</span>
                    </span>
                    <span className="level-trailing">
                      {!!best[index] && <span className="level-best">{formatScore(best[index])}<small>BEST</small></span>}
                      <span className="level-state"><Icon name={locked ? 'lock' : 'arrow-up-right'} size={locked ? 16 : 19} /></span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="unlock-note"><Icon name={unlocked === LEVELS.length ? 'check' : 'lock'} size={13} /><p>{unlocked === LEVELS.length ? 'Semua lantai terbuka. Saatnya mencetak rekor baru.' : 'Tuntaskan misi. Buka lantai berikutnya.'}</p></div>

          <button className="start-button" type="button" onClick={onStart}>
            <span><span className="start-label">MULAI MISI</span><span className="start-destination">{level.name} / LEVEL {String(selected + 1).padStart(2, '0')}</span></span>
            <span className="start-arrow"><Icon name="arrow" size={24} /></span>
          </button>
          <p className="start-hint">{touchDevice && mobileControls ? <><span>Sentuh untuk mulai</span><span className="hint-separator">·</span><span>Gunakan landscape</span></> : <><kbd>ENTER</kbd><span>untuk mulai</span><span className="hint-separator">·</span><span>↑ ↓ pilih lantai</span></>}</p>
        </section>
      </main>

      <footer className="menu-footer menu-container">
        <div className="quick-controls" aria-label="Kontrol singkat">
          {touchDevice && mobileControls ? <><span><Icon name="device" size={17} /> 2 joystick</span><span><Icon name="crosshair" size={17} /> Bidik + auto serang</span><span>Landscape</span></> : <><span><kbd>WASD</kbd> Gerak</span><span><Icon name="mouse" size={17} /> Serang</span><span><kbd>C</kbd> Focus</span></>}
        </div>
        <div className="footer-right">
          <span className="save-indicator"><Icon name="check" size={14} /> Progres otomatis tersimpan</span>
          <div className="total-score"><span>SKOR TOTAL</span><strong>{formatScore(totalBest)}</strong><span className="score-unit">PTS</span></div>
        </div>
      </footer>
      {notice && <div className="menu-notice" role="status">{notice}</div>}
    </div>
  );
}
