import { baseURL, serverURL } from "../config";

export function getVoiceNoteAudioUrls(record) {
  const urls = [];
  const apiHost = baseURL.replace(/\/api\/?$/, "");

  if (record.playable_path) {
    urls.push(
      `${serverURL}/voice/${record.playable_path.replace(/^\//, "")}`
    );
  }

  if (record.recording_path) {
    const recordingPath = record.recording_path.replace(/\\/g, "/");

    if (
      recordingPath.startsWith("/voice/") ||
      recordingPath.startsWith("/recordings/")
    ) {
      urls.push(`${serverURL}${recordingPath}`);
    } else if (
      recordingPath.startsWith("http://") ||
      recordingPath.startsWith("https://")
    ) {
      urls.push(recordingPath);
    } else {
      const fileName = recordingPath.split("/").pop();
      if (fileName) {
        urls.push(`${serverURL}/voice/custom/${fileName}`);
      }
    }
  }

  if (record.id) {
    if (serverURL !== apiHost) {
      urls.push(`${serverURL}/api/voice-notes/${record.id}/audio`);
    }
    urls.push(`${apiHost}/api/voice-notes/${record.id}/audio`);
    urls.push(`${baseURL}/voice-notes/${record.id}/audio`);
  }

  return [...new Set(urls)];
}

function loadAudioFromUrl(url) {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const cleanup = () => {
      audio.oncanplaythrough = null;
      audio.onerror = null;
    };

    audio.oncanplaythrough = () => {
      cleanup();
      resolve(audio);
    };
    audio.onerror = () => {
      cleanup();
      reject(new Error(`Unable to load audio from ${url}`));
    };

    audio.src = url;
    audio.load();
  });
}

export async function playVoiceNoteAudio(record) {
  const urls = getVoiceNoteAudioUrls(record);
  let lastError = null;

  for (const url of urls) {
    try {
      const audio = await loadAudioFromUrl(url);
      await audio.play();
      return { audio, url };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError || new Error("Voice note audio file not found");
}
