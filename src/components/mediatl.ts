import { v } from '../tokens/theme';
import { c as bc, iconNode, iconRule } from './button';
import { iconButton } from './bits';
import { P, focus, lines, motion, n, p, ringDecl, text } from './shared';
import { srOnly } from './kit';
import type { IconName } from '../icons/icons';
import type { ComponentDef, Node, Props } from './types';

const mt = {
  root: `${p}-mt`, bar: `${p}-mt__bar`, sep: `${p}-mt__sep`, grow: `${p}-mt__grow`, time: `${p}-mt__time`, zoom: `${p}-mt__zoom`, ic: `${p}-mt__ic`, icOn: `${p}-mt__ic--on`,
  body: `${p}-mt__body`, labels: `${p}-mt__labels`, corner: `${p}-mt__corner`, label: `${p}-mt__label`, scroll: `${p}-mt__scroll`, canvas: `${p}-mt__canvas`, ruler: `${p}-mt__ruler`, tick: `${p}-mt__tick`,
  lane: `${p}-mt__lane`, clip: `${p}-mt__clip`, video: `${p}-mt__clip--video`, audio: `${p}-mt__clip--audio`, textc: `${p}-mt__clip--text`, on: `${p}-mt__clip--on`, name: `${p}-mt__name`, handle: `${p}-mt__handle`,
  playhead: `${p}-mt__playhead`, sr: `${p}-mt__sr`,
};
export const pad2 = (x: number) => String(x).padStart(2, '0');
export const timecode = (t: number, fps: number) => { const f = Math.round(t * fps), s = Math.floor(f / fps), ff = f % fps; return `${pad2(Math.floor(s / 3600))}:${pad2(Math.floor((s % 3600) / 60))}:${pad2(s % 60)}:${pad2(ff)}`; };
const short = (t: number) => `${Math.floor(t / 60)}:${pad2(Math.round(t % 60))}`;
const STEPS = [1, 2, 5, 10, 15, 30, 60, 120, 300, 600];
export const tickStep = (pps: number) => STEPS.find((s) => s * pps >= 72) ?? 1200;
const kindOf = (name: string, hint = '') => { const h = (hint || name).toLowerCase(); return /audio|music|sound|voice|sfx/.test(h) ? 'audio' : /text|title|caption|subtitle/.test(h) ? 'text' : 'video'; };
const clipCls = (k: string) => (k === 'audio' ? mt.audio : k === 'text' ? mt.textc : mt.video);
const px = (secs: number) => `calc(var(--p8-pps) * ${secs}px)`;

export interface TLClip { track: string; name: string; start: number; duration: number }
export function parseClips(s: unknown, tracks: string[], dur: number): TLClip[] {
  const known = new Map(tracks.map((t) => [t.toLowerCase(), t]));
  return lines(s).map((l) => { const [track = '', name = '', st = '0', du = '1'] = l.split('|').map((x) => x.trim()); return { track: known.get(track.toLowerCase()) ?? '', name: name || 'Clip', start: Math.max(0, Number(st) || 0), duration: Math.max(0.1, Number(du) || 1) }; })
    .filter((c) => c.track && c.start < dur).map((c) => ({ ...c, duration: Math.min(c.duration, dur - c.start) }));
}

export const mediaTimeline: ComponentDef = {
  id: 'media-timeline', name: 'Media Timeline', description: 'A video-editor timeline: tracks, clips, a ruler and a playhead you scrub, trim, split, snap and zoom.', tags: ['media', 'editor', 'time'], status: 'stable',
  usage: 'Drag on the ruler or any lane to scrub the playhead; drag a clip to move it (also between tracks), drag its edges to trim; clips never overlap on a track. Snap pulls edges to the playhead, other clips, the start and the end (toggle with the magnet). Zoom with the buttons or Ctrl/⌘ + scroll. Keyboard: on the ruler ← → step a frame (Shift: a second), Home/End, PageUp/PageDown 5 s, Space plays; on a clip ← → → focus the neighbour, ↑ ↓ the track above/below, Alt + arrows move it (frames, Shift for seconds; Alt+↑↓ changes track), [ and ] trim to the playhead, S splits, Delete removes. Events: p8-seek { time, timecode }, p8-select { clip }, p8-change { clips: [{ track, name, start, duration }] }.',
  composition: 'Icon Buttons in a toolbar, a ruler that is also a slider, and lanes of clip buttons.',
  props: [
    P.text('label', 'Timeline', 'Accessible name of the whole timeline.'),
    P.area('tracks', 'Video 2\nVideo 1\nAudio 1', 'Track names, top first. Names with audio/music/sound are audio tracks, text/title/caption are text tracks.', 'string (one per line)'),
    P.area('clips', 'Video 1 | Intro | 0 | 6\nVideo 1 | Interview | 6.5 | 12\nVideo 2 | Title | 1 | 4\nAudio 1 | Music | 0 | 24', 'One clip per line: Track | Name | start seconds | duration seconds.', 'string (one per line)'),
    P.text('duration', '30', 'Length of the timeline in seconds.'),
    P.select('fps', ['24', '25', '30', '60'], '30', 'Frames per second (for the timecode and frame steps).'),
    P.select('zoom', ['12', '24', '48', '96'], '24', 'Pixels per second at the start.'),
    P.text('time', '0', 'Playhead position in seconds.'),
    P.bool('snap', true, 'Snap edges to the playhead, clips, start and end.'),
    P.bool('playing', false, 'Start playing.'),
    P.bool('controls', true, 'Show the toolbar.'),
  ],
  rules: [
    { cls: mt.root, base: { position: 'relative', display: 'flex', 'flex-direction': 'column', 'box-sizing': 'border-box', width: v('size-720'), 'max-width': '100%', overflow: 'hidden', padding: '0', 'border-radius': v('radius-12'), background: v('color-surface'), color: v('color-ink'), ...ringDecl, ...text('sm') } },
    { cls: mt.bar, base: { display: 'flex', 'align-items': 'center', gap: v('space-4'), 'box-sizing': 'border-box', 'padding-block': v('space-4'), 'padding-inline': v('space-8'), 'border-bottom': `${v('border-hairline')} solid ${v('color-ring')}` } },
    { cls: mt.sep, base: { width: '0', height: v('size-16'), 'margin-inline': v('space-4'), 'border-left': `${v('border-hairline')} solid ${v('color-ring')}` } },
    { cls: mt.grow, base: { flex: '1' } },
    { cls: mt.time, base: { 'font-family': v('type-mono'), 'letter-spacing': v('type-tracking-mono'), 'font-variant-numeric': 'tabular-nums', 'min-width': v('size-96'), 'text-align': 'center', color: v('color-ink') } },
    { cls: mt.zoom, base: { 'font-family': v('type-mono'), 'letter-spacing': v('type-tracking-mono'), 'min-width': v('size-40'), 'text-align': 'center', color: v('color-ink-muted') } },
    { cls: mt.ic, base: { display: 'none' } },
    { cls: mt.icOn, base: { display: 'block' } },
    { cls: mt.body, base: { display: 'flex', 'min-width': '0' } },
    { cls: mt.labels, base: { display: 'flex', 'flex-direction': 'column', 'flex-shrink': '0', width: v('size-96'), 'border-right': `${v('border-hairline')} solid ${v('color-ring')}`, background: v('color-surface') } },
    { cls: mt.corner, base: { height: v('size-24'), 'border-bottom': `${v('border-hairline')} solid ${v('color-ring')}` } },
    { cls: mt.label, base: { display: 'flex', 'align-items': 'center', gap: v('space-8'), height: v('size-48'), 'box-sizing': 'border-box', 'padding-inline': v('space-8'), color: v('color-ink-muted'), 'border-bottom': `${v('border-hairline')} solid ${v('color-ring')}`, overflow: 'hidden', 'white-space': 'nowrap', 'text-overflow': 'ellipsis' } },
    { cls: mt.scroll, base: { flex: '1', 'min-width': '0', 'overflow-x': 'auto', 'overflow-y': 'hidden', 'scrollbar-width': 'thin', 'scrollbar-color': `${v('color-ring-focus')} transparent` } },
    { cls: mt.canvas, base: { position: 'relative', 'user-select': 'none', 'touch-action': 'none', 'min-width': '100%' } },
    { cls: mt.ruler, base: { position: 'relative', height: v('size-24'), 'box-sizing': 'border-box', cursor: 'pointer', 'border-bottom': `${v('border-hairline')} solid ${v('color-ring')}`, 'background-image': `repeating-linear-gradient(to right, ${v('color-ring')} 0, ${v('color-ring')} ${v('border-hairline')}, transparent ${v('border-hairline')}, transparent calc(var(--p8-pps) * ${v('unit-px')}))`, 'background-size': '100% 40%', 'background-repeat': 'no-repeat', 'background-position': 'bottom left', color: v('color-ink-muted') }, focus: { 'box-shadow': `inset 0 0 0 ${v('border-focus')} ${v('color-ring-focus')}` } },
    { cls: mt.tick, base: { position: 'absolute', top: '0', bottom: '0', 'padding-inline-start': v('space-4'), 'border-left': `${v('border-hairline')} solid ${v('color-ring')}`, 'font-family': v('type-mono'), 'letter-spacing': v('type-tracking-mono'), 'pointer-events': 'none', 'white-space': 'nowrap' } },
    { cls: mt.lane, base: { position: 'relative', height: v('size-48'), 'box-sizing': 'border-box', 'border-bottom': `${v('border-hairline')} solid ${v('color-ring')}` } },
    { cls: mt.clip, base: { position: 'absolute', top: v('space-4'), bottom: v('space-4'), display: 'flex', 'align-items': 'center', 'box-sizing': 'border-box', 'min-width': v('space-4'), padding: '0', overflow: 'hidden', border: 'none', 'border-radius': v('radius-4'), color: v('color-ink'), cursor: 'grab', 'text-align': 'left', ...text('sm') }, focus },
    { cls: mt.video, base: { background: v('color-control-strong') } },
    { cls: mt.audio, base: { background: v('color-control'), ...ringDecl } },
    { cls: mt.textc, base: { background: v('color-canvas'), ...ringDecl } },
    { cls: mt.on, base: { outline: `${v('border-focus')} solid ${v('color-ink')}`, 'outline-offset': `calc(-1 * ${v('border-focus')})` } },
    { cls: mt.name, base: { flex: '1', 'min-width': '0', overflow: 'hidden', 'text-overflow': 'ellipsis', 'white-space': 'nowrap', 'padding-inline': v('space-8'), 'pointer-events': 'none' } },
    { cls: mt.handle, base: { position: 'absolute', top: '0', bottom: '0', width: v('space-8'), cursor: 'ew-resize', background: 'transparent', transition: `background ${motion}` }, parent: { cls: mt.clip, hover: { background: v('color-ring-focus') } } },
    { cls: `${mt.handle}--start`, base: { left: '0' } },
    { cls: `${mt.handle}--end`, base: { right: '0' } },
    { cls: mt.playhead, base: { position: 'absolute', top: '0', bottom: '0', width: v('space-2'), translate: '-50% 0', background: v('color-ink'), 'pointer-events': 'none', 'z-index': '5' },
      nested: [{ sel: '::before', decls: { content: "''", position: 'absolute', top: '0', left: '50%', translate: '-50% 0', width: v('space-12'), height: v('space-12'), 'border-radius': v('radius-4'), background: v('color-ink') } }] },
    { cls: mt.sr, base: srOnly },
    iconRule,
  ],
  render(pr: Props): Node {
    const duration = Math.max(1, Number(pr.duration) || 30);
    const fps = Number(pr.fps) || 30;
    const pps = Number(pr.zoom) || 24;
    const time = Math.min(duration, Math.max(0, Number(pr.time) || 0));
    const trackLines = lines(pr.tracks).map((l) => { const [name, hint = ''] = l.split('|').map((x) => x.trim()); return { name, kind: kindOf(name, hint) }; });
    const tracks = trackLines.length ? trackLines : [{ name: 'Video 1', kind: 'video' }];
    const clips = parseClips(pr.clips, tracks.map((t) => t.name), duration);
    const first = clips[0];
    const ib = (icon: IconName, label: string, act: string, extra: Node['attrs'] = {}): Node => { const b = iconButton.render({ icon, label, size: '16', variant: 'ghost-flat', disabled: false }); return { ...b, attrs: { ...b.attrs, 'data-act': act, ...extra } }; };
    const play = ib('play', pr.playing ? 'Pause' : 'Play', 'play', { 'aria-pressed': String(Boolean(pr.playing)) });
    play.children = [{ ...iconNode('play', 16), cls: [bc.icon, mt.ic, ...(pr.playing ? [] : [mt.icOn])] }, { ...iconNode('pause', 16), cls: [bc.icon, mt.ic, ...(pr.playing ? [mt.icOn] : [])] }];
    const tickNode = (t: number): Node => n('span', [mt.tick], [short(t)], { 'data-tick': true, 'aria-hidden': 'true', style: `left: ${px(t)}` });
    const step = tickStep(pps);
    const ticks: Node[] = []; for (let t = 0; t <= duration; t += step) ticks.push(tickNode(t));
    const tc = timecode(time, fps);
    const clipNode = (c: TLClip, kind: string, tabbable: boolean): Node => n('button', [mt.clip, clipCls(kind)], [
      n('span', [mt.handle, `${mt.handle}--start`], [], { 'data-handle': 'start', 'aria-hidden': 'true' }),
      n('span', [mt.name], [c.name], { 'data-name': true }),
      n('span', [mt.handle, `${mt.handle}--end`], [], { 'data-handle': 'end', 'aria-hidden': 'true' }),
    ], { type: 'button', 'data-clip': true, 'data-start': String(c.start), 'data-dur': String(c.duration), 'aria-pressed': 'false', tabindex: tabbable ? '0' : '-1', 'aria-label': `${c.name}, ${c.track}, starts at ${timecode(c.start, fps)}, ${Math.round(c.duration * 100) / 100} seconds`, style: `left: ${px(c.start)}; width: ${px(c.duration)}` });
    const toolbar = pr.controls ? [n('div', [mt.bar], [
      ib('skip-back', 'Go to start', 'start'), play, ib('skip-forward', 'Go to end', 'end'),
      n('span', [mt.sep], [], { role: 'separator', 'aria-orientation': 'vertical' }),
      ib('scissors', 'Split at playhead', 'split'), ib('trash', 'Delete clip', 'delete'), ib('magnet', 'Snapping', 'snap', { 'aria-pressed': String(Boolean(pr.snap)) }),
      n('span', [mt.grow], []),
      n('output', [mt.time], [tc], { 'data-timecode': true, 'aria-label': 'Playhead timecode' }),
      n('span', [mt.grow], []),
      ib('zoom-out', 'Zoom out', 'zoomout'), n('span', [mt.zoom], [`${+(pps / 24).toFixed(1)}×`], { 'data-zoomlabel': true, 'aria-hidden': 'true' }), ib('zoom-in', 'Zoom in', 'zoomin'),
    ], { role: 'toolbar', 'aria-label': 'Timeline controls' })] : [];
    return n('section', [mt.root], [
      ...toolbar,
      n('div', [mt.body], [
        n('div', [mt.labels], [n('div', [mt.corner], []), ...tracks.map((t) => n('div', [mt.label], [iconNode(t.kind === 'audio' ? 'music' : t.kind === 'text' ? 'file' : 'video', 14), t.name]))], { 'aria-hidden': 'true' }),
        n('div', [mt.scroll], [
          n('div', [mt.canvas], [
            n('div', [mt.ruler], ticks, { role: 'slider', tabindex: '0', 'aria-label': 'Playhead', 'aria-valuemin': '0', 'aria-valuemax': String(duration), 'aria-valuenow': String(time), 'aria-valuetext': tc, 'data-ruler': true }),
            ...tracks.map((t) => n('div', [mt.lane], clips.filter((c) => c.track === t.name).map((c) => clipNode(c, t.kind, c === first)), { role: 'group', 'aria-label': `Track ${t.name}`, 'data-lane': true, 'data-track': t.name, 'data-kind': t.kind })),
            n('div', [mt.playhead], [], { 'data-playhead': true, 'aria-hidden': 'true', style: `left: ${px(time)}` }),
          ], { 'data-canvas': true, style: `width: ${px(duration)}` }),
        ], { 'data-scroll': true }),
      ]),
      n('p', [mt.sr], [], { role: 'status', 'aria-live': 'polite', 'data-live': true }),
      n('template', [], [tickNode(0)], { 'data-parts': true }),
    ], { role: 'group', 'aria-label': (pr.label as string) || 'Timeline', 'data-p8': 'mediatl', 'data-fps': String(fps), 'data-duration': String(duration), 'data-time': String(time), 'data-pps': String(pps), 'data-snap': String(Boolean(pr.snap)), 'data-playing': String(Boolean(pr.playing)), style: `--p8-pps: ${pps}` });
  },
};
