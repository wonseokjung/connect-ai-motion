// The common contract that ties every source together (Remotion packages, HyperFrames blocks, Lottie files, shaders,
// the kit's own scenes, your own .tsx, a clip made by any other tool).
// One item = one folder: catalog/<source>/<name>/{meta.json, index.tsx | block.html | anim.json}.
// A storyboard line calls any of them with one word: {"kind": "remotion/title-blur", "say": "...", "text": "..."}.
// Timing, the two shapes (16:9, 9:16) and the checks are the same for every source. Pure JS (Node + browser).
// Same field names as connect-ai-video-motion (kind, title, description, source, license, use, props, example, family,
// dur, status, reasons); this kit adds role, changes, maxWords and type.
import {METAS} from '../catalog/metas.generated.mjs';

export const ROLES = ['scene', 'bg', 'transition', 'sweep'];
export const USES = ['brand', 'title', 'statement', 'keyword', 'number', 'chart', 'steps', 'flow', 'timeline', 'list', 'compare', 'quote', 'emphasis', 'code', 'formula', 'prompt', 'dialogue', 'hero3d', 'icon', 'voice', 'end', 'background', 'transition', 'clip', 'picture', 'device', 'map', 'diagram', 'data', 'character'];
export const SOURCES = ['kit', 'remotion', 'hyperframes', 'lottie', 'shader', 'custom', 'clip'];
export const STATUS = ['ok', 'needs-download', 'unsupported'];
// what carries a scene: a picture (object, drawing, chart, diagram, photo, 3D) or type (words are the picture)
export const LEADS = ['picture', 'type'];
// fields of a storyboard line that put words on screen (checked against "say"); code and tex are not checked
export const TEXT_FIELDS = ['text', 'sub', 'label', 'label2', 'value', 'unit', 'from', 'to', 'by'];
export const LIST_FIELDS = ['items', 'lines'];

// an allow list, not a block list: anything else (CC BY, GPL, AGPL, non-commercial, no licence) stays out
export const LICENSES = /^(MIT|Apache-2\.0|ISC|BSD-[23]-Clause|Zlib|0BSD|CC0(-1\.0)?|Remotion License|yours)$/;

export const kindOf = (k) => String(k || '');

/** meta for a storyboard line: catalog entry, or an entry built from the line itself (your own file) */
export function metaFor(it, metas = METAS) {
  const kind = kindOf(it.kind);
  if (metas[kind]) return metas[kind];
  if (kind === 'custom' || kind === 'hyperframes' || kind === 'lottie' || kind === 'clip') {
    const m = it.meta || {};
    return {
      kind,
      title: m.title || it.component || it.src || kind,
      source: {type: kind, path: it.component || it.src},
      license: m.license || 'yours',
      role: m.role || 'scene',
      use: m.use || (kind === 'clip' ? 'clip' : 'statement'),
      dur: m.dur || 3,
      family: m.family || `${kind}:${it.component || it.src}`,
      canvas: m.canvas || null,
      crop: m.crop || null,
      window: m.window || null,
      text: m.text || null,
      changes: m.changes || null,
      maxWords: m.maxWords || 14,
      lead: m.lead || (kind === 'clip' || kind === 'custom' || kind === 'lottie' ? 'picture' : null),
      user: true,
      status: 'ok',
    };
  }
  return null;
}

/** Check one meta.json. Returns a list of sentences (empty = fine). */
export function validateMeta(m, dirName = '') {
  const e = [];
  const need = (k) => { if (m[k] == null || m[k] === '') e.push(`"${k}" is missing`); };
  for (const k of ['kind', 'title', 'description', 'source', 'license', 'role', 'use', 'family']) need(k);
  if (m.kind && dirName && !m.kind.endsWith('/' + dirName)) e.push(`kind "${m.kind}" must end with the folder name "${dirName}"`);
  if (m.kind && !SOURCES.includes(m.kind.split('/')[0])) e.push(`kind must start with one of ${SOURCES.join(', ')}`);
  if (m.role && !ROLES.includes(m.role)) e.push(`role "${m.role}" is not one of ${ROLES.join(', ')}`);
  if (m.use && !USES.includes(m.use)) e.push(`use "${m.use}" is not one of ${USES.join(', ')}`);
  if (m.status && !STATUS.includes(m.status)) e.push(`status "${m.status}" is not one of ${STATUS.join(', ')}`);
  const playable = !m.status || m.status === 'ok';
  if (!playable && !(Array.isArray(m.reasons) && m.reasons.length)) e.push(`status "${m.status}" needs "reasons": [why it cannot play]`);
  if (m.dur != null && !(m.dur > 0 && m.dur < 30)) e.push('dur must be seconds (0-30)');
  if (m.source && typeof m.source === 'object' && !m.source.type) e.push('source.type is missing');
  if (m.license && !LICENSES.test(String(m.license))) e.push(`license "${m.license}" is not on the list this catalog accepts (MIT, Apache-2.0, ISC, BSD, Zlib, 0BSD, CC0, Remotion License, yours)`);
  if (m.props && typeof m.props !== 'object') e.push('props must be an object {field: what it is}');
  if (playable && m.role === 'scene' && !m.example) e.push('a scene needs "example": {field: value} so the gallery can play it');
  if (m.changes != null && !(m.changes === 'items' || m.changes === 'words' || (Array.isArray(m.changes) && m.changes.every((x) => x >= 0 && x <= 1)))) e.push('changes must be "items", "words" or a list of fractions of the scene (0-1)');
  if (m.maxWords != null && !(m.maxWords > 0)) e.push('maxWords must be a number > 0');
  if (playable && m.role === 'scene' && !LEADS.includes(m.lead)) e.push('a scene needs "lead": "picture" (an object, drawing, chart, photo or 3D carries it) or "type" (words carry it)');
  if (m.media != null && !(Array.isArray(m.media) && m.media.every((x) => typeof x === 'string'))) e.push('media must be a list of field names that hold files, for example ["src"]');
  return e;
}

export const listCatalog = (metas = METAS) => Object.values(metas).sort((a, b) => (a.kind < b.kind ? -1 : 1));
export const playable = (m) => m && (!m.status || m.status === 'ok');
/** 'picture' | 'type' | null (unknown: your own block) */
export const leadOf = (m) => (m && LEADS.includes(m.lead) ? m.lead : null);

/** the files a storyboard line points to, through the fields its scene lists in "media" (a path, a list of paths, or a list of {src}) */
export function mediaOf(it, meta) {
  const out = [];
  for (const f of meta?.media || []) {
    const v = it?.[f];
    const list = Array.isArray(v) ? v : v == null || v === '' ? [] : [v];
    for (const x of list) {
      const s = x && typeof x === 'object' ? x.src : x;
      if (typeof s === 'string' && s) out.push(s);
    }
  }
  return out;
}
