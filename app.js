const STORAGE_KEY = 'offline_music_player_tracks_v1';
const CURRENT_INDEX_KEY = 'offline_music_player_current_idx';

const fileInput = document.getElementById('fileInput');
const trackList = document.getElementById('trackList');
const trackTitle = document.getElementById('trackTitle');
const trackMeta = document.getElementById('trackMeta');
const audio = document.getElementById('audio');
const playBtn = document.getElementById('playBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const seekBar = document.getElementById('seekBar');
const currentTimeEl = document.getElementById('currentTime');
const durationEl = document.getElementById('duration');
const volumeBar = document.getElementById('volumeBar');
const clearBtn = document.getElementById('clearBtn');

let tracks = loadTracks();
let currentIndex = Number(localStorage.getItem(CURRENT_INDEX_KEY)) || 0;
let isSeeking = false;

function formatTime(sec) {
  if (!Number.isFinite(sec)) return '0:00';
  const minutes = Math.floor(sec / 60);
  const seconds = Math.floor(sec % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function saveTracks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
}

function loadTracks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function persistCurrentIndex() {
  localStorage.setItem(CURRENT_INDEX_KEY, String(currentIndex));
}

function readAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

async function addFiles(fileList) {
  const files = [...fileList].filter((file) => file.type.startsWith('audio/'));
  for (const file of files) {
    const dataUrl = await readAsDataURL(file);
    tracks.push({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      type: file.type,
      dataUrl,
    });
  }
  saveTracks();
  renderTrackList();
  if (tracks.length && !audio.src) {
    loadTrack(0);
  }
}

function loadTrack(index) {
  if (!tracks.length) {
    audio.removeAttribute('src');
    trackTitle.textContent = 'No track selected';
    trackMeta.textContent = 'Add songs to get started.';
    renderTrackList();
    return;
  }

  if (index < 0) index = tracks.length - 1;
  if (index >= tracks.length) index = 0;

  currentIndex = index;
  persistCurrentIndex();

  const track = tracks[currentIndex];
  audio.src = track.dataUrl;
  trackTitle.textContent = track.name;
  trackMeta.textContent = `${track.type} • ${formatBytes(track.size)}`;
  renderTrackList();
}

function renderTrackList() {
  trackList.innerHTML = '';
  if (!tracks.length) {
    trackList.innerHTML = '<li class="track-meta">No songs added yet.</li>';
    return;
  }

  tracks.forEach((track, index) => {
    const li = document.createElement('li');
    li.className = `track-item ${index === currentIndex ? 'active' : ''}`;
    li.innerHTML = `
      <span>${track.name}</span>
      <span class="track-meta">${formatBytes(track.size)}</span>
    `;
    li.addEventListener('click', () => {
      loadTrack(index);
      audio.play();
    });
    trackList.appendChild(li);
  });
}

function playPause() {
  if (!tracks.length) return;
  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
  }
}

fileInput.addEventListener('change', async (event) => {
  const files = event.target.files;
  if (files && files.length) {
    await addFiles(files);
    event.target.value = '';
  }
});

playBtn.addEventListener('click', playPause);
prevBtn.addEventListener('click', () => {
  loadTrack(currentIndex - 1);
  audio.play();
});
nextBtn.addEventListener('click', () => {
  loadTrack(currentIndex + 1);
  audio.play();
});

clearBtn.addEventListener('click', () => {
  tracks = [];
  currentIndex = 0;
  audio.pause();
  audio.removeAttribute('src');
  saveTracks();
  persistCurrentIndex();
  renderTrackList();
  trackTitle.textContent = 'No track selected';
  trackMeta.textContent = 'Library cleared. Add songs to continue.';
  seekBar.value = 0;
  currentTimeEl.textContent = '0:00';
  durationEl.textContent = '0:00';
});

audio.addEventListener('play', () => {
  playBtn.textContent = '⏸';
});

audio.addEventListener('pause', () => {
  playBtn.textContent = '▶';
});

audio.addEventListener('loadedmetadata', () => {
  seekBar.value = 0;
  currentTimeEl.textContent = '0:00';
  durationEl.textContent = formatTime(audio.duration);
});

audio.addEventListener('timeupdate', () => {
  if (isSeeking || !Number.isFinite(audio.duration) || audio.duration === 0) return;
  const progress = (audio.currentTime / audio.duration) * 100;
  seekBar.value = String(progress);
  currentTimeEl.textContent = formatTime(audio.currentTime);
});

audio.addEventListener('ended', () => {
  loadTrack(currentIndex + 1);
  audio.play();
});

seekBar.addEventListener('input', () => {
  isSeeking = true;
});

seekBar.addEventListener('change', () => {
  if (!Number.isFinite(audio.duration) || audio.duration === 0) {
    isSeeking = false;
    return;
  }
  const pct = Number(seekBar.value) / 100;
  audio.currentTime = pct * audio.duration;
  isSeeking = false;
});

volumeBar.addEventListener('input', () => {
  audio.volume = Number(volumeBar.value);
});

(function init() {
  audio.volume = Number(volumeBar.value);
  renderTrackList();
  if (tracks.length) {
    if (currentIndex >= tracks.length) currentIndex = 0;
    loadTrack(currentIndex);
  }
})();
