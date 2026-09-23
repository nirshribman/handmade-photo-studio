import {useEffect, useId, useRef, useState} from 'react';
import type {ButtonHTMLAttributes, PointerEvent as ReactPointerEvent, ReactNode, RefObject} from 'react';
import {Maximize, Minus, Plus, ScanSearch, Hand, MousePointer2} from 'lucide-react';

type Point = {x: number; y: number};
type Navigation = {zoom: number; pan: Point};
type Selection = {start: Point; end: Point};
const FIT: Navigation = {zoom: 1, pan: {x: 0, y: 0}};
const percentages = [10, 25, 50, 100, 200, 400, 800];

// A touch tap immediately after a pinch can lose its synthesized click in Chrome.
// Commit a stationary touch on release and cancel the duplicate compatibility click.
function NavigationButton({onClick, ...props}: Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'> & {onClick: () => void}) {
  const touch = useRef<{id: number; x: number; y: number} | null>(null);
  return <button {...props} onClick={onClick}
    onTouchStart={event => {const point = event.touches[0]; touch.current = event.touches.length === 1 ? {id: point.identifier, x: point.clientX, y: point.clientY} : null;}}
    onTouchMove={event => {const start = touch.current, point = event.touches[0]; if (start && (event.touches.length !== 1 || Math.hypot(point.clientX - start.x, point.clientY - start.y) > 10)) touch.current = null;}}
    onTouchCancel={() => {touch.current = null;}}
    onTouchEnd={event => {
      const start = touch.current;
      touch.current = null;
      const point = event.changedTouches[0], rect = event.currentTarget.getBoundingClientRect();
      if (!start || point.identifier !== start.id || event.touches.length || Math.hypot(point.clientX - start.x, point.clientY - start.y) > 10 || point.clientX < rect.left || point.clientX > rect.right || point.clientY < rect.top || point.clientY > rect.bottom) return;
      event.preventDefault();
      onClick();
    }}/>
}

interface Props {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  aspect: number;
  referenceLong: number;
  checkerboard: boolean;
  enabled: boolean;
  sweep: boolean;
  onSweep: (angle: number | null) => void;
  onInspect: (x: number, y: number) => void;
  onResolutionChange: (needed: boolean) => void;
  children?: ReactNode;
  artworkOverlay?: ReactNode;
  onPick?: (x:number,y:number)=>void;
}

/** Navigation is local UI state: it never modifies the recipe or export framing. */
export function CanvasViewport({canvasRef, aspect, referenceLong, checkerboard, enabled, sweep, onSweep, onInspect, onResolutionChange, children, artworkOverlay, onPick}: Props) {
  const viewport = useRef<HTMLDivElement>(null);
  const mount = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({width: 1, height: 1});
  const [navigation, setNavigation] = useState<Navigation>(FIT);
  const current = useRef(navigation);
  const [areaMode, setAreaMode] = useState(false);
  const [selection, setSelection] = useState<Selection | null>(null);
  const selectionRef = useRef<Selection | null>(null);
  const pointers = useRef(new Map<number, Point>());
  const [hand,setHand]=useState(false);
  const tap=useRef<{id:number;start:Point;pan:boolean}|null>(null);
  const [moving, setMoving] = useState(false);
  const hintId = useId();
  const referenceWidth = aspect > 1 ? referenceLong : referenceLong * aspect;
  const referenceHeight = referenceWidth / aspect;
  const fitScale = Math.max(.0001, Math.min(Math.max(1, size.width - 32) / referenceWidth, Math.max(1, size.height - 32) / referenceHeight));
  const baseWidth = referenceWidth * fitScale, baseHeight = referenceHeight * fitScale;
  const percent = Math.round(navigation.zoom * fitScale * 100);
  const fitted = Math.abs(navigation.zoom - 1) < .0001 && navigation.pan.x === 0 && navigation.pan.y === 0;
  const highResolution = navigation.zoom > 1.01;

  useEffect(() => {
    const el = viewport.current!;
    const measure = () => setSize({width: el.clientWidth, height: el.clientHeight});
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => onResolutionChange(highResolution), [highResolution, onResolutionChange]);
  useEffect(() => { if (sweep) {setAreaMode(false); setSelection(null); selectionRef.current = null;} }, [sweep]);

  function update(next: Navigation) {
    const boundX = Math.max(0, (baseWidth * next.zoom + size.width) / 2 - 60);
    const boundY = Math.max(0, (baseHeight * next.zoom + size.height) / 2 - 60);
    const bounded = {...next, pan: {
      x: Math.max(-boundX, Math.min(boundX, next.pan.x)),
      y: Math.max(-boundY, Math.min(boundY, next.pan.y)),
    }};
    current.current = bounded;
    setNavigation(bounded);
  }

  function fit() {
    current.current = FIT;
    setNavigation(FIT);
    setAreaMode(false);
    setSelection(null);
    selectionRef.current = null;
  }

  function zoomAt(requested: number, point: Point = {x: size.width / 2, y: size.height / 2}, previousPoint = point) {
    const old = current.current;
    const zoom = Math.max(Math.min(.1, .05 / fitScale), Math.min(Math.max(1, 8 / fitScale), requested));
    const ratio = zoom / old.zoom;
    update({zoom, pan: {
      x: point.x - size.width / 2 - (previousPoint.x - size.width / 2 - old.pan.x) * ratio,
      y: point.y - size.height / 2 - (previousPoint.y - size.height / 2 - old.pan.y) * ratio,
    }});
  }

  // React wheel listeners are passive. Use a non-passive listener only on the
  // worktable, so wheel/pinch zoom cannot also scroll or zoom the browser page.
  useEffect(() => {
    const el = viewport.current!;
    const wheel = (event: WheelEvent) => {
      if (!enabled || (event.target as HTMLElement).closest('button, .detail-view')) return;
      event.preventDefault();
      const rect = el.getBoundingClientRect();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? size.height : 1);
      zoomAt(current.current.zoom * Math.exp(-Math.max(-200, Math.min(200, delta)) * .003), {x: event.clientX - rect.left, y: event.clientY - rect.top});
    };
    el.addEventListener('wheel', wheel, {passive: false});
    return () => el.removeEventListener('wheel', wheel);
  }, [enabled, fitScale, size.width, size.height]);

  function local(event: ReactPointerEvent<HTMLDivElement>): Point {
    const rect = event.currentTarget.getBoundingClientRect();
    return {x: event.clientX - rect.left, y: event.clientY - rect.top};
  }

  function pointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (!enabled || event.button !== 0 || (event.target as HTMLElement).closest('button, .detail-view')) return;
    event.currentTarget.focus({preventScroll: true});
    event.currentTarget.setPointerCapture(event.pointerId);
    const point = local(event);
    pointers.current.set(event.pointerId, point);
    tap.current={id:event.pointerId,start:point,pan:!onPick||hand||event.altKey};
    if (pointers.current.size > 1) {tap.current=null;selectionRef.current = null; setSelection(null); setAreaMode(false); setMoving(true); return;}
    if (sweep) {onSweep(point.x / size.width * 360); return;}
    if (areaMode) {
      const next = {start: point, end: point};
      selectionRef.current = next;
      setSelection(next);
    } else setMoving(true);
  }

  function pointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const point = local(event);
    // Use the transformed artwork bounds, including pan and zoom, for the loupe.
    const rect = mount.current?.getBoundingClientRect();
    if (rect) onInspect(Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)));
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    if (pointers.current.size > 1) {
      const oldPair = [...pointers.current.values()].slice(0, 2);
      pointers.current.set(event.pointerId, point);
      const pair = [...pointers.current.values()].slice(0, 2);
      const middle = (p: Point[]) => ({x: (p[0].x + p[1].x) / 2, y: (p[0].y + p[1].y) / 2});
      const distance = (p: Point[]) => Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      zoomAt(current.current.zoom * distance(pair) / Math.max(1, distance(oldPair)), middle(pair), middle(oldPair));
      return;
    }
    pointers.current.set(event.pointerId, point);
    if (sweep) {onSweep(point.x / size.width * 360); return;}
    if (selectionRef.current) {
      const next = {...selectionRef.current, end: {x: Math.max(0, Math.min(size.width, point.x)), y: Math.max(0, Math.min(size.height, point.y))}};
      selectionRef.current = next;
      setSelection(next);
      return;
    }
    if(tap.current&&!tap.current.pan)return;
    const old = current.current;
    update({...old, pan: {x: old.pan.x + point.x - previous.x, y: old.pan.y + point.y - previous.y}});
  }

  function finishPointer(event: ReactPointerEvent<HTMLDivElement>, cancelled = false) {
    if (!pointers.current.has(event.pointerId)) return;
    const box = selectionRef.current;
    const press=tap.current;tap.current=null;
    if(!cancelled&&!box&&!sweep&&press&&press.id===event.pointerId&&!press.pan&&Math.hypot(local(event).x-press.start.x,local(event).y-press.start.y)<6){const rect=mount.current?.getBoundingClientRect();if(rect)onPick?.((event.clientX-rect.left)/rect.width,(event.clientY-rect.top)/rect.height);}
    pointers.current.delete(event.pointerId);
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (!pointers.current.size) setMoving(false);
    if (box) {
      if (!cancelled && Math.abs(box.end.x - box.start.x) > 8 && Math.abs(box.end.y - box.start.y) > 8) {
        const factor = Math.min((size.width - 32) / Math.abs(box.end.x - box.start.x), (size.height - 32) / Math.abs(box.end.y - box.start.y));
        zoomAt(current.current.zoom * factor, {x: size.width / 2, y: size.height / 2}, {x: (box.start.x + box.end.x) / 2, y: (box.start.y + box.end.y) / 2});
        setAreaMode(false);
      }
      selectionRef.current = null;
      setSelection(null);
    }
    onSweep(null);
  }

  const selectValue = fitted ? 'fit' : String(percent);
  return <div className="canvas-navigation">
    <div className="canvas-zoom-bar" role="group" aria-label="Canvas navigation">
      {onPick&&<><NavigationButton aria-label="Select pieces" aria-pressed={!hand} className={!hand?'selected':''} onClick={()=>setHand(false)}><MousePointer2 size={15}/></NavigationButton><NavigationButton aria-label="Pan canvas" aria-pressed={hand} className={hand?'selected':''} onClick={()=>setHand(true)}><Hand size={15}/></NavigationButton></>}
      <span className="zoom-label">ZOOM</span>
      <NavigationButton aria-label="Zoom out" title="Zoom out · −" disabled={!enabled} onClick={() => zoomAt(current.current.zoom / 1.25)}><Minus size={15}/></NavigationButton>
      <select aria-label="Canvas zoom" title="100% shows one default-export pixel per screen pixel" disabled={!enabled} value={selectValue} onChange={event => event.target.value === 'fit' ? fit() : zoomAt(Number(event.target.value) / 100 / fitScale)}>
        <option value="fit">Fit · {Math.round(fitScale * 100)}%</option>
        {!fitted && !percentages.includes(percent) && <option value={percent}>{percent}%</option>}
        {percentages.map(value => <option key={value} value={value}>{value}%{value === 100 ? ' · 1:1' : ''}</option>)}
      </select>
      <NavigationButton aria-label="Zoom in" title="Zoom in · +" disabled={!enabled} onClick={() => zoomAt(current.current.zoom * 1.25)}><Plus size={15}/></NavigationButton>
      <span className="zoom-divider"/>
      <NavigationButton aria-label="Fit artwork" title="Fit and centre · 0" disabled={!enabled} onClick={fit}><Maximize size={14}/><span>Fit</span></NavigationButton>
      <NavigationButton aria-pressed={areaMode} className={areaMode ? 'selected' : ''} title="Draw a rectangle to enlarge that area" disabled={!enabled || sweep} onClick={() => {setAreaMode(value => !value); setSelection(null); selectionRef.current = null; viewport.current?.focus({preventScroll: true});}}><ScanSearch size={15}/><span>Zoom area</span></NavigationButton>
    </div>
    <div className={`preview-space navigable ${onPick&&!hand?'piece-selection ':''}${areaMode ? 'selecting-area' : moving ? 'panning' : sweep ? 'sweeping' : ''}`} ref={viewport} role="group" aria-label="Canvas zoom and pan" aria-describedby={hintId} tabIndex={0}
      onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={event => finishPointer(event)} onPointerCancel={event => finishPointer(event, true)} onLostPointerCapture={event => finishPointer(event, true)}
      onDoubleClick={event => {if (!enabled || sweep || areaMode || (event.target as HTMLElement).closest('button, .detail-view')) return; const rect = event.currentTarget.getBoundingClientRect(); fitted ? zoomAt(Math.max(2, 1 / fitScale), {x: event.clientX - rect.left, y: event.clientY - rect.top}) : fit();}}
      onKeyDown={event => {
        if (event.target !== event.currentTarget || !enabled || event.ctrlKey || event.metaKey || event.altKey) return;
        if (event.key === '+' || event.key === '=') {event.preventDefault(); zoomAt(current.current.zoom * 1.25);}
        if (event.key === '-') {event.preventDefault(); zoomAt(current.current.zoom / 1.25);}
        if (event.key === '0') {event.preventDefault(); fit();}
        if (event.key === '1') {event.preventDefault(); zoomAt(1 / fitScale);}
        if (event.key === 'Escape') {setAreaMode(false); setSelection(null); selectionRef.current = null; pointers.current.clear(); setMoving(false);}
        if (event.key.startsWith('Arrow')) {event.preventDefault(); const old = current.current; update({...old, pan: {x: old.pan.x + (event.key === 'ArrowLeft' ? 40 : event.key === 'ArrowRight' ? -40 : 0), y: old.pan.y + (event.key === 'ArrowUp' ? 40 : event.key === 'ArrowDown' ? -40 : 0)}});}
      }}>
      <div ref={mount} className={`canvas-mount ${checkerboard ? 'checkerboard' : ''}`} data-zoom={percent} style={{width: baseWidth, height: baseHeight, transform: `translate(${navigation.pan.x}px, ${navigation.pan.y}px) scale(${navigation.zoom})`}}>
        <canvas ref={canvasRef} aria-label="Rendered photograph and paper" role="img"/>{artworkOverlay}
      </div>
      {children}
      {selection && <div className="zoom-selection" aria-label="Selected zoom area" style={{left: Math.min(selection.start.x, selection.end.x), top: Math.min(selection.start.y, selection.end.y), width: Math.abs(selection.end.x - selection.start.x), height: Math.abs(selection.end.y - selection.start.y)}}/>}
      {areaMode && <div className="zoom-area-hint">Drag around the detail you want to enlarge. Esc to cancel.</div>}
    </div>
    <div className="canvas-navigation-hint" id={hintId}>{onPick?'Tap a piece to select · Hand tool to pan · Scroll to zoom':'Scroll or pinch to zoom · Drag to pan · Double-click to zoom / fit'}</div>
  </div>;
}
