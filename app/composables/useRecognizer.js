import {
  fingerprint, packHashes, unpackHashes, toIndex, alignPacked, best,
  SAMPLE_RATE, FRAMES_PER_SECOND, FINGERPRINT_VERSION
} from '~/utils/fingerprint';

/**
 * Recognising a song from a few seconds of microphone audio.
 *
 * The signal processing happens here, in the browser, and only integers leave
 * the device — see utils/fingerprint.js for the constellation and
 * octava-backend AI-NOTES.md §5 for why it is ours rather than a provider's.
 *
 * AI-DECISION: matching is tried against the local cache first and the server
 * only after. That order is the point of the feature. A venue's wifi is the
 * least reliable thing about a gig, and a recogniser that needs a network is a
 * recogniser that fails exactly when it is being used. When the setlist has
 * been cached the network is never touched at all.
 */

const DB_NAME = 'octava-otisci';
const STORE = 'prints';
const DB_VERSION = 1;

/** Long enough to identify, short enough that nobody waits twice. */
export const DEFAULT_SECONDS = 8;

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: 'song' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(db, mode, run) {
  return new Promise((resolve, reject) => {
    const store = db.transaction(STORE, mode).objectStore(STORE);
    const req = run(store);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Decodes anything the browser can play, at the one rate the fingerprint knows.
 *
 * AI-TRAP: the resampling is not optional and not approximate. An OfflineAudio-
 * Context asked for 8000Hz does a proper band-limited conversion; picking every
 * sixth sample by hand aliases everything above 4kHz down into the range the
 * constellation reads, and the fingerprint that comes out matches nothing —
 * silently, because there is no error in a wrong number.
 */
async function decodeTo8k(arrayBuffer) {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const decoder = new Ctx();

  try {
    const decoded = await decoder.decodeAudioData(arrayBuffer);
    const frames = Math.ceil(decoded.duration * SAMPLE_RATE);

    const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    const offline = new Offline(1, frames, SAMPLE_RATE);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination);
    source.start();

    const rendered = await offline.startRendering();
    return rendered.getChannelData(0);
  } finally {
    decoder.close?.();
  }
}

export function useRecognizer() {
  /** idle | listening | working | done | error */
  const state = ref('idle');
  const error = ref(null);
  const result = ref(null);
  const cachedCount = ref(0);
  const secondsLeft = ref(0);

  let stream = null;
  let recorder = null;
  let countdown = null;

  async function readCache() {
    try {
      const db = await openDb();
      const rows = await tx(db, 'readonly', (s) => s.getAll());
      db.close();
      return rows.filter((r) => r.version === FINGERPRINT_VERSION);
    } catch {
      // Private mode, a full quota, a browser with storage switched off. The
      // server path still works; there is nothing to tell the user here.
      return [];
    }
  }

  async function refreshCached() {
    cachedCount.value = (await readCache()).length;
  }

  /** Downloads prints for the given songs and stores them for offline use. */
  async function cacheOffline(songIds) {
    const { $api } = useNuxtApp();
    if (!songIds?.length) return 0;

    const body = await $api.raw('/recognize/offline?songs=' + songIds.join(','), {
      responseType: 'arrayBuffer'
    });
    const bytes = new Uint8Array(body._data ?? body);
    const view = new DataView(bytes.buffer, bytes.byteOffset);

    const headerLength = view.getUint32(0, true);
    const manifest = JSON.parse(new TextDecoder().decode(bytes.subarray(4, 4 + headerLength)));
    const base = 4 + headerLength;

    const db = await openDb();
    for (const entry of manifest.prints) {
      await tx(db, 'readwrite', (s) => s.put({
        song: entry.song,
        version: manifest.version,
        seconds: entry.seconds,
        // Sliced into its own buffer: a view over the shared one would keep the
        // whole download alive in storage, every print holding all the others.
        hashes: bytes.slice(base + entry.offset, base + entry.offset + entry.bytes)
      }));
    }
    db.close();

    await refreshCached();
    return manifest.prints.length;
  }

  async function clearCache() {
    const db = await openDb();
    await tx(db, 'readwrite', (s) => s.clear());
    db.close();
    await refreshCached();
  }

  /** The local half: identical arithmetic to the server, over cached bytes. */
  async function matchLocally(pairs) {
    const rows = await readCache();
    if (!rows.length) return null;

    const index = toIndex(pairs);
    const scored = rows.map((row) => ({ song: row.song, ...alignPacked(index, row.hashes) }));
    const winner = best(scored, pairs.length);
    if (!winner) return null;

    // /songs/:identifier resolves an ObjectId as readily as a slug (byIdOrSlug),
    // so the offline half needs no endpoint of its own.
    const { $api } = useNuxtApp();
    const found = await $api(`/songs/${winner.song}`).catch(() => null);
    if (!found?.song) return null;

    return {
      ...found.song,
      atSecond: Math.max(0, Math.round(winner.offset / FRAMES_PER_SECOND)),
      offline: true
    };
  }

  async function matchOnServer(pairs) {
    const { $api } = useNuxtApp();
    const res = await $api('/recognize', {
      method: 'POST',
      body: packHashes(pairs),
      headers: { 'Content-Type': 'application/octet-stream' }
    });
    return res.match ? { ...res.match, offline: false } : null;
  }

  async function listen(seconds = DEFAULT_SECONDS) {
    if (state.value === 'listening' || state.value === 'working') return;

    error.value = null;
    result.value = null;
    state.value = 'listening';
    secondsLeft.value = seconds;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          // The same three as the tuner, for the same reason: noise suppression
          // eats sustained tones and AGC keeps moving the amplitude the peak
          // threshold is measured against.
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      const chunks = [];
      recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);

      const finished = new Promise((resolve) => { recorder.onstop = resolve; });
      recorder.start();

      countdown = setInterval(() => {
        secondsLeft.value = Math.max(0, secondsLeft.value - 1);
      }, 1000);

      await new Promise((r) => setTimeout(r, seconds * 1000));
      stopRecording();
      await finished;

      state.value = 'working';

      const samples = await decodeTo8k(await new Blob(chunks).arrayBuffer());
      const pairs = fingerprint(samples);

      result.value = (await matchLocally(pairs)) || (await matchOnServer(pairs));
      state.value = 'done';
    } catch (err) {
      error.value = err?.name === 'NotAllowedError' ? 'permission' : 'failed';
      state.value = 'error';
      stopRecording();
    }
  }

  function stopRecording() {
    clearInterval(countdown);
    countdown = null;
    secondsLeft.value = 0;

    if (recorder?.state === 'recording') recorder.stop();
    stream?.getTracks().forEach((track) => track.stop());
    stream = null;
  }

  function reset() {
    result.value = null;
    error.value = null;
    state.value = 'idle';
  }

  onBeforeUnmount(stopRecording);
  onMounted(refreshCached);

  return {
    state, error, result, secondsLeft, cachedCount,
    listen, reset, cacheOffline, clearCache, refreshCached,
    // Exposed so an indexing screen can fingerprint a file the same way.
    decodeTo8k, fingerprint, packHashes, unpackHashes
  };
}
