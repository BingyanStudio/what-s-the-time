import { useCallback, useEffect, useRef } from "react";

const SOUND_VOLUME = 0.15;
const SOUND_FILES = [1, 2, 3, 4, 5].map(
  (index) => `/sound/mechanical/${index}.wav`,
);

/** 预加载并随机播放打字机机械音。 */
export function useMechanicalSound() {
  const cache = useRef(new Map<string, HTMLAudioElement>());

  useEffect(() => {
    for (const path of SOUND_FILES) {
      const audio = new Audio(path);
      audio.preload = "auto";
      audio.volume = SOUND_VOLUME;
      cache.current.set(path, audio);
    }
    return () => cache.current.clear();
  }, []);

  return useCallback(() => {
    const path = SOUND_FILES[Math.floor(Math.random() * SOUND_FILES.length)];
    const audio = cache.current.get(path);
    if (!audio) return;
    if (!audio.paused) audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  }, []);
}
