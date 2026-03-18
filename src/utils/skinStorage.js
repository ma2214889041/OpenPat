const DB_NAME = 'openpat-assets';
const DB_VERSION = 1;

export function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('skins')) {
        db.createObjectStore('skins', { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains('achievements')) {
        db.createObjectStore('achievements', { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (event) => reject(event.target.error);
  });
}

export async function saveSkin(skin) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('skins', 'readwrite');
    const store = tx.objectStore('skins');
    const request = store.put(skin);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadAllSkins() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('skins', 'readonly');
    const store = tx.objectStore('skins');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getSkin(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('skins', 'readonly');
    const store = tx.objectStore('skins');
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteSkin(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('skins', 'readwrite');
    const store = tx.objectStore('skins');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function saveAchievementDef(ach) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('achievements', 'readwrite');
    const store = tx.objectStore('achievements');
    const request = store.put(ach);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadAllAchievementDefs() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('achievements', 'readonly');
    const store = tx.objectStore('achievements');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteAchievementDef(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('achievements', 'readwrite');
    const store = tx.objectStore('achievements');
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export function blobToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

export async function prepareSkinForDisplay(skin) {
  const STATE_NAMES = ['idle', 'happy', 'thinking', 'tool_call', 'done', 'error', 'offline', 'react'];
  const convertedFrames = {};

  for (const stateName of STATE_NAMES) {
    const blobs = skin.frames?.[stateName];
    if (Array.isArray(blobs) && blobs.length > 0) {
      const dataURLs = await Promise.all(
        blobs.map((blob) => {
          if (blob instanceof Blob) {
            return blobToDataURL(blob);
          }
          // Already a string (data URL or regular URL), pass through
          return Promise.resolve(blob);
        })
      );
      convertedFrames[stateName] = dataURLs;
    } else {
      convertedFrames[stateName] = [];
    }
  }

  return {
    ...skin,
    frames: convertedFrames,
  };
}
