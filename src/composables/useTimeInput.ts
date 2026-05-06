import { nextTick, ref } from "vue";
import { useMechanicalSound } from "@/composables/useMechanicalSound";
import {
  TIME_INPUT_FORMAT,
  TIME_INPUT_SEPARATOR_INDEX,
  TIME_SUBMIT_DELAY,
} from "@/constants";

export interface UseTimeInputOptions {
  onComplete: (time: string) => void;
  onCharChange?: (index: number, value: string) => void;
  disabled?: () => boolean;
}

/**
 * 时间输入逻辑 Composable
 * 管理时间输入的状态和交互逻辑
 */
export function useTimeInput(options: UseTimeInputOptions) {
  const { onComplete, onCharChange, disabled } = options;

  // 机械音效
  const { playRandomSound } = useMechanicalSound();

  // 状态
  const chars = ref<string[]>([...TIME_INPUT_FORMAT]);
  const refs = ref<(HTMLInputElement | null)[]>([]);
  const isProcessing = ref(false);

  /**
   * 构建时间字符串
   */
  const buildTimeString = (): string => {
    return `${chars.value[0]}${chars.value[1]}:${chars.value[3]}${chars.value[4]}`;
  };

  /**
   * 检查时间是否输入完成
   */
  const checkComplete = () => {
    const timeStr = buildTimeString();

    if (chars.value[0] && chars.value[1] && chars.value[3] && chars.value[4]) {
      // 验证时间格式
      if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
        // 延迟一下再提交，让用户看到完整的输入
        setTimeout(() => {
          onComplete(timeStr);
        }, TIME_SUBMIT_DELAY);
      }
    }
  };

  /**
   * 计算下一个输入框的索引
   */
  const getNextIndex = (currentIndex: number): number => {
    if (currentIndex < 4 && currentIndex !== 1) {
      // 跳过冒号位置
      return currentIndex === 1 ? 3 : currentIndex + 1;
    } else if (currentIndex === 1) {
      // 小时输入完成，移动到分钟
      return 3;
    }
    return currentIndex;
  };

  /**
   * 计算上一个输入框的索引
   */
  const getPrevIndex = (currentIndex: number): number => {
    if (currentIndex === 3) return 1;
    if (currentIndex === 4) return 3;
    return currentIndex - 1;
  };

  /**
   * 处理单个字符输入
   */
  const handleInput = (e: Event, index: number) => {
    // 如果禁用，不处理输入
    if (disabled?.()) {
      e.preventDefault();
      return;
    }

    const input = e.target as HTMLInputElement;
    let value = input.value;

    // 只允许数字（除了分隔符位置）
    if (index !== TIME_INPUT_SEPARATOR_INDEX) {
      const hadValue = !!chars.value[index];
      value = value.replace(/\D/g, "");
      if (value) {
        chars.value[index] = value;
        onCharChange?.(index, value);

        // 播放机械音效
        playRandomSound();

        // 自动移动到下一个输入框
        const nextIndex = getNextIndex(index);
        if (nextIndex !== index) {
          nextTick(() => {
            refs.value[nextIndex]?.focus();
          });
        }

        // 检查是否输入完成
        checkComplete();
      } else {
        // 如果之前有值但现在为空，说明是删除操作
        if (hadValue) {
          // 播放机械音效
          playRandomSound();
        }
        chars.value[index] = "";
      }
    } else {
      // 分隔符位置不允许输入
      chars.value[index] = ":";
    }
  };

  /**
   * 处理键盘事件
   */
  const handleKeydown = (e: KeyboardEvent, index: number) => {
    // 如果禁用，不处理键盘事件
    if (disabled?.()) {
      e.preventDefault();
      return;
    }

    // 处理退格键
    if (e.key === "Backspace" && !chars.value[index] && index > 0) {
      e.preventDefault();
      const prevIndex = getPrevIndex(index);
      if (prevIndex >= 0 && chars.value[prevIndex]) {
        chars.value[prevIndex] = "";
        // 播放机械音效
        playRandomSound();
        nextTick(() => {
          refs.value[prevIndex]?.focus();
        });
      }
    }

    // 处理方向键
    if (e.key === "ArrowLeft" && index > 0) {
      const prevIndex = getPrevIndex(index);
      if (prevIndex >= 0) {
        nextTick(() => {
          refs.value[prevIndex]?.focus();
        });
      }
    }

    if (e.key === "ArrowRight" && index < 4) {
      const nextIndex = getNextIndex(index);
      if (nextIndex <= 4) {
        nextTick(() => {
          refs.value[nextIndex]?.focus();
        });
      }
    }
  };

  /**
   * 处理粘贴
   */
  const handlePaste = (e: ClipboardEvent) => {
    // 如果禁用，不处理粘贴
    if (disabled?.()) {
      e.preventDefault();
      return;
    }

    e.preventDefault();
    const pastedText = e.clipboardData?.getData("text") || "";
    const cleaned = pastedText.replace(/\D/g, "").slice(0, 4);

    if (cleaned.length === 4) {
      chars.value[0] = cleaned[0];
      chars.value[1] = cleaned[1];
      chars.value[3] = cleaned[2];
      chars.value[4] = cleaned[3];
      checkComplete();
    }
  };

  /**
   * 设置输入框 ref
   */
  const setRef = (el: HTMLInputElement | null, index: number) => {
    if (el) {
      refs.value[index] = el;
    }
  };

  /**
   * 聚焦指定输入框
   */
  const focus = (index: number = 0) => {
    nextTick(() => {
      refs.value[index]?.focus();
    });
  };

  /**
   * 重置输入
   */
  const reset = () => {
    chars.value = [...TIME_INPUT_FORMAT];
    isProcessing.value = false;
  };

  return {
    chars,
    refs,
    isProcessing,
    handleInput,
    handleKeydown,
    handlePaste,
    setRef,
    focus,
    reset,
    buildTimeString,
  };
}
