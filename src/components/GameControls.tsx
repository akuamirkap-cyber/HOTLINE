import { useEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import type { Game, GameSnapshot } from '../game/engine';
import { LEVELS } from '../game/levels';
import { Icon } from './Icon';
import '../game-controls.css';

interface JoystickProps {
  kind: 'move' | 'aim';
  onChange: (x: number, y: number) => void;
}

function Joystick({ kind, onChange }: JoystickProps) {
  const pointer = useRef<number | null>(null);
  const element = useRef<HTMLButtonElement>(null);
  const callback = useRef(onChange);
  callback.current = onChange;
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);

  useEffect(() => {
    const releaseCapture = () => {
      const id = pointer.current;
      pointer.current = null;
      if (id !== null && element.current?.hasPointerCapture(id)) element.current.releasePointerCapture(id);
    };
    const cancel = () => {
      releaseCapture();
      setOffset({ x: 0, y: 0 }); setActive(false);
      callback.current(0, 0);
    };
    window.addEventListener('blur', cancel);
    return () => { window.removeEventListener('blur', cancel); releaseCapture(); callback.current(0, 0); };
  }, []);

  const move = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const radius = bounds.width * 0.32;
    const x = event.clientX - bounds.left - bounds.width / 2;
    const y = event.clientY - bounds.top - bounds.height / 2;
    const distance = Math.hypot(x, y);
    const ratio = distance > radius ? radius / distance : 1;
    setOffset({ x: x * ratio, y: y * ratio });
    if (distance < radius * 0.12) callback.current(0, 0);
    else callback.current(x * ratio / radius, y * ratio / radius);
  };

  const release = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (pointer.current !== event.pointerId) return;
    pointer.current = null;
    setOffset({ x: 0, y: 0 });
    setActive(false);
    callback.current(0, 0);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <div className={`joystick-zone joystick-${kind}`}>
      <button
        ref={element}
        type="button"
        className={`joystick${active ? ' is-active' : ''}`}
        aria-label={kind === 'move' ? 'Joystick gerak' : 'Joystick bidik dan serang'}
        onPointerDown={(event) => {
          if (pointer.current !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
          event.preventDefault();
          pointer.current = event.pointerId;
          event.currentTarget.setPointerCapture(event.pointerId);
          setActive(true);
          move(event);
        }}
        onPointerMove={(event) => { if (pointer.current === event.pointerId) { event.preventDefault(); move(event); } }}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={release}
      >
        <span className="joystick-axis axis-x" /><span className="joystick-axis axis-y" />
        <span className="joystick-inner-ring" />
        <span className="joystick-knob" style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}><Icon name={kind === 'move' ? 'arrow-up-right' : 'crosshair'} size={23} /></span>
      </button>
      <span className="joystick-label">{kind === 'move' ? 'GERAK' : 'BIDIK + AUTO SERANG'}</span>
    </div>
  );
}

interface ActionButtonProps {
  label: string;
  icon: ReactNode;
  className?: string;
  detail?: string;
  onPress: () => void;
  onRelease?: () => void;
  children?: ReactNode;
}

function ActionButton({ label, icon, detail, className = '', onPress, onRelease, children }: ActionButtonProps) {
  const pointer = useRef<number | null>(null);
  const element = useRef<HTMLButtonElement>(null);
  const releaseCallback = useRef(onRelease);
  releaseCallback.current = onRelease;
  const [pressed, setPressed] = useState(false);
  useEffect(() => {
    const releaseCapture = () => {
      const id = pointer.current;
      pointer.current = null;
      if (id !== null && element.current?.hasPointerCapture(id)) element.current.releasePointerCapture(id);
    };
    const cancel = () => { releaseCapture(); setPressed(false); releaseCallback.current?.(); };
    window.addEventListener('blur', cancel);
    return () => { window.removeEventListener('blur', cancel); releaseCapture(); releaseCallback.current?.(); };
  }, []);

  const release = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (pointer.current !== event.pointerId) return;
    pointer.current = null;
    setPressed(false);
    onRelease?.();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
  };

  return (
    <button
      ref={element}
      type="button"
      className={`touch-action ${label === 'LEMPAR / AMBIL' ? 'weapon-action ' : ''}${className}${pressed ? ' is-pressed' : ''}`}
      aria-label={label === 'FOKUS' ? 'Tahan FOKUS' : label}
      onPointerDown={(event) => {
        if (pointer.current !== null || (event.pointerType === 'mouse' && event.button !== 0)) return;
        event.preventDefault();
        pointer.current = event.pointerId;
        event.currentTarget.setPointerCapture(event.pointerId);
        setPressed(true);
        onPress();
      }}
      onPointerUp={release}
      onPointerCancel={release}
      onLostPointerCapture={release}
      onClick={(event) => { if (event.detail === 0) onPress(); }}
      onKeyDown={(event) => { if (onRelease && (event.code === 'Space' || event.code === 'Enter')) { event.preventDefault(); if (!event.repeat) onPress(); } }}
      onKeyUp={(event) => { if (onRelease && (event.code === 'Space' || event.code === 'Enter')) { event.preventDefault(); onRelease(); } }}
    >
      {icon}<span>{label === 'LEMPAR / AMBIL' ? 'LEMPAR/AMBIL' : label}</span>{detail && <small>{detail}</small>}{children}
    </button>
  );
}

interface GameControlsProps {
  game: Game | null;
  snapshot: GameSnapshot | null;
  enabled: boolean;
  rotateRequired: boolean;
  onToggle: () => void;
  onLandscape: () => void;
}

export function GameControls({ game, snapshot, enabled, rotateRequired, onToggle, onLandscape }: GameControlsProps) {
  const primaryButton = useRef<HTMLButtonElement>(null);
  const rotateButton = useRef<HTMLButtonElement>(null);
  const state = snapshot?.state || 'intro';
  const showDialog = state === 'paused' || state === 'dead' || !!snapshot?.showResults;
  const active = !!game && !showDialog && !rotateRequired;

  useEffect(() => {
    if (rotateRequired) rotateButton.current?.focus();
    else if (showDialog) primaryButton.current?.focus();
  }, [showDialog, state, rotateRequired]);

  return (
    <div className={`game-interface${enabled ? ' has-touch-controls' : ''}`}>
      {!showDialog && !rotateRequired && (
        <div className="game-toolbar">
          <button type="button" className={`game-tool-button mobile-controls-toggle${enabled ? ' is-on' : ''}`} onClick={onToggle} aria-pressed={enabled} aria-label={enabled ? 'Sembunyikan tombol mobile' : 'Perlihatkan tombol mobile'} title={enabled ? 'Sembunyikan tombol mobile' : 'Perlihatkan tombol mobile'}><Icon name="device" size={18} /><span>{enabled ? 'Kontrol mobile aktif' : 'PERLIHATKAN TOMBOL MOBILE'}</span></button>
          <button type="button" className="game-tool-button game-pause-button" onClick={() => game?.togglePause()} aria-label="Pause game"><Icon name="pause" size={19} /></button>
        </div>
      )}

      {enabled && active && (
        <div className="touch-layout" aria-label="Kontrol mobile landscape">
          <Joystick kind="move" onChange={(x, y) => game.setTouchMove(x, y)} />
          <Joystick kind="aim" onChange={(x, y) => game.setTouchAim(x, y)} />
          <div className="touch-actions">
            <ActionButton label="TENDANG" icon={<Icon name="kick" size={24} />} onPress={() => game.pressTouchAction('kick')} />
            <ActionButton label="LEMPAR / AMBIL" detail={snapshot?.weaponAction} icon={<Icon name="swap" size={23} />} onPress={() => game.pressTouchAction('weapon')} />
            <ActionButton label="FOKUS" icon={<Icon name="crosshair" size={24} />} className={`focus-button${snapshot?.focusActive ? ' is-focusing' : ''}`} onPress={() => game.setTouchFocus(true)} onRelease={() => game.setTouchFocus(false)}><span className="touch-focus-meter"><i style={{ width: `${snapshot?.focusPercent ?? 100}%` }} /></span></ActionButton>
            <ActionButton label="AKSI" detail={snapshot?.action || 'SPRINT'} icon={<Icon name="bolt" size={25} />} className="context-action" onPress={() => game.pressTouchAction('action')} />
          </div>
        </div>
      )}

      {showDialog && !rotateRequired && game && snapshot && (
        <div className="game-state-backdrop">
          <section className={`game-state-card${snapshot.showResults ? ' results-card' : ''}`} role="dialog" aria-modal="true" aria-labelledby="game-dialog-title">
            <span className="game-dialog-eyebrow"><i /> {state === 'paused' ? 'TAKE A BREATH' : state === 'dead' ? 'REFLEX. INSTINCT. REPEAT.' : 'MISSION ACCOMPLISHED'}</span>
            <h2 id="game-dialog-title">{state === 'paused' ? 'DIJEDA.' : state === 'dead' ? 'COBA LAGI.' : 'LANTAI BERSIH.'}</h2>
            <p>{state === 'paused' ? 'Susun langkah berikutnya. Jangan jadi target.' : state === 'dead' ? 'Satu kesalahan bukan akhir permainan.' : `${LEVELS[snapshot.level].name} / tak ada yang tersisa.`}</p>
            {snapshot.showResults && <div className="game-results"><div><span>SKOR MISI</span><strong>{Math.floor(snapshot.score).toString().padStart(6, '0')}</strong></div><div className="result-grade"><span>GRADE</span><strong>{snapshot.grade}</strong></div></div>}
            <div className="game-dialog-actions">
              <button ref={primaryButton} type="button" className="game-primary-button" disabled={snapshot.showResults && !snapshot.nextReady} onClick={() => { if (state === 'paused') game.togglePause(); else if (state === 'dead') game.restart(); else if (snapshot.nextReady) game.advance(); }}>{state === 'paused' ? 'LANJUT' : state === 'dead' ? 'ULANGI MISI' : snapshot.level + 1 < LEVELS.length ? 'LANTAI BERIKUTNYA' : 'SELESAI'}<Icon name="arrow" size={20} /></button>
              <button type="button" className="game-secondary-button" onClick={() => game.quit()}>KELUAR KE MENU</button>
            </div>
            <div className="game-dialog-footer"><span>{enabled ? 'Kendalikan waktu. Tetap hidup.' : state === 'paused' ? 'ESC lanjut / Q keluar' : state === 'dead' ? 'R ulangi / ESC menu' : 'ENTER lanjut'}</span><button type="button" onClick={onToggle}>{enabled ? 'Sembunyikan kontrol mobile' : 'Perlihatkan tombol mobile'}</button></div>
          </section>
        </div>
      )}

      {rotateRequired && (
        <div className="rotate-backdrop">
          <section className="rotate-card" role="alertdialog" aria-modal="true" aria-labelledby="rotate-title" aria-describedby="rotate-description">
            <div className="rotate-symbol"><Icon name="rotate" size={54} /></div>
            <span className="game-dialog-eyebrow">BEST PLAYED WIDE</span>
            <h2 id="rotate-title">PUTAR<br />PERANGKATMU.</h2>
            <p id="rotate-description">Gunakan mode landscape untuk bergerak dan membidik dengan dua joystick. Game dijeda sampai layar diputar.</p>
            <button ref={rotateButton} type="button" className="game-primary-button" onClick={onLandscape}>COBA FULLSCREEN & LANDSCAPE<Icon name="arrow" size={20} /></button>
            <button type="button" className="rotate-exit" onClick={() => game?.quit()}>Kembali ke menu</button>
            <small>Jika browser tidak mendukung rotasi otomatis, putar perangkat secara manual.</small>
          </section>
        </div>
      )}
    </div>
  );
}
