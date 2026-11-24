// Where a HyperFrames / Lottie / clip file of a storyboard line is served from (work/fm-assets/<name>). Same answer in Node and in the browser.
const hash = (s) => {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0;
  return h.toString(36);
};
// the extension of a served file: letters and digits only (a name never carries a path or a query into fm-assets/)
const extOf = (file) => (String(file).split('?')[0].split('.').pop().toLowerCase().match(/^[a-z0-9]{1,5}$/) || ['bin'])[0];
export function assetName(kind, file) {
  const ext = extOf(file);
  if (kind === 'hyperframes' || kind === 'lottie' || kind === 'clip') return `user_${kind}_${hash(String(file))}.${ext}`;
  return `${String(kind).replace(/[^a-z0-9-]+/gi, '__')}__${String(file).replace(/[^a-z0-9.-]+/gi, '_')}`;
}

// Pictures, clips and models a scene shows ("media" fields of a catalog scene): work/fm-assets/media_<hash>.<ext>.
// A path that starts with "kit:" is a file that ships with the kit (kit:examples/media/photo-1.jpg); any other path
// is looked up from your project folder.
export function mediaName(file) {
  const ext = extOf(file);
  return `media_${hash(String(file))}.${ext}`;
}
