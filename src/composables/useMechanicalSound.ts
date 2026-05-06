import { ref } from "vue";

/**
 * 机械音效音量（0-1之间）
 */
const SOUND_VOLUME = 0.15;

/**
 * 机械音效管理 Composable
 * 用于在打字动画时随机播放机械音效
 */
export function useMechanicalSound() {
  // 音频文件路径数组（public 目录下的文件可以通过 / 开头的绝对路径访问）
  const soundFiles = [
    "/sound/mechanical/1.wav",
    "/sound/mechanical/2.wav",
    "/sound/mechanical/3.wav",
    "/sound/mechanical/4.wav",
    "/sound/mechanical/5.wav",
  ];

  // 预加载的音频对象缓存
  const audioCache = ref<Map<string, HTMLAudioElement>>(new Map());

  /**
   * 预加载所有音频文件
   */
  const preloadSounds = () => {
    soundFiles.forEach((soundPath) => {
      if (!audioCache.value.has(soundPath)) {
        try {
          const audio = new Audio(soundPath);
          audio.preload = "auto";
          audio.volume = SOUND_VOLUME;
          audioCache.value.set(soundPath, audio);
        } catch (error) {
          console.warn(`Failed to preload sound: ${soundPath}`, error);
        }
      }
    });
  };

  /**
   * 随机播放一个机械音效
   */
  const playRandomSound = () => {
    if (soundFiles.length === 0) return;

    // 随机选择一个音频文件
    const randomIndex = Math.floor(Math.random() * soundFiles.length);
    const soundPath = soundFiles[randomIndex];

    // 从缓存获取或创建新的音频对象
    let audio = audioCache.value.get(soundPath);

    if (!audio) {
      try {
        audio = new Audio(soundPath);
        audio.volume = SOUND_VOLUME;
        audio.preload = "auto";
        audioCache.value.set(soundPath, audio);
      } catch (error) {
        console.warn(`Failed to load sound: ${soundPath}`, error);
        return;
      }
    }

    // 如果音频正在播放，先重置
    if (!audio.paused) {
      audio.currentTime = 0;
    }

    // 播放音频（忽略错误，避免在静音模式下报错）
    audio.play().catch(() => {
      // 静默处理播放错误（例如用户未交互或浏览器限制）
    });
  };

  // 初始化时预加载
  preloadSounds();

  return {
    playRandomSound,
    preloadSounds,
  };
}
