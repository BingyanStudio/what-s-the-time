import type { Ref } from "vue";

export interface UseKeyboardNavigationOptions {
  showNextLine: () => void;
  backToStart: () => void;
  isAllLinesComplete: Ref<boolean>;
  skipCurrentLine: () => void;
  getTypingComponent: (index: number) => any;
  currentLineIndex: Ref<number>;
  displayedLines: Ref<any[]>;
}

/**
 * 键盘导航逻辑 Composable
 * 处理全局键盘事件和文本操作
 */
export function useKeyboardNavigation(options: UseKeyboardNavigationOptions) {
  const {
    showNextLine,
    backToStart,
    isAllLinesComplete,
    skipCurrentLine,
    getTypingComponent,
    currentLineIndex,
    displayedLines,
  } = options;

  /**
   * 处理全局键盘事件
   */
  const handleGlobalKeyDown = (event: KeyboardEvent) => {
    // 如果按的是 Enter 或空格
    if (event.key === "Enter" || event.key === " ") {
      // 如果焦点在输入框上，不处理（让输入框自己处理）
      const target = event.target as HTMLElement;
      if (
        target &&
        (target.classList.contains("time-input-char") ||
          target.closest(".time-input-char"))
      ) {
        return;
      }

      // 如果所有行都已完成（包括回到开始按钮），触发回到开始
      if (isAllLinesComplete.value) {
        event.preventDefault();
        backToStart();
        return;
      }

      // 如果焦点在按钮上，不处理
      if (
        target &&
        (target.classList.contains("back-button") ||
          target.closest(".back-button"))
      ) {
        return;
      }

      event.preventDefault();
      handleTextAction();
    }
  };

  /**
   * 处理文本区域点击
   */
  const handleTextClick = (event: MouseEvent) => {
    // 如果点击的是选择按钮、输入框或按钮，不处理
    const target = event.target as HTMLElement;
    if (
      target.closest(".choice-button") ||
      target.closest(".time-input-char") ||
      target.closest(".back-button") ||
      target.closest(".input-line") ||
      target.closest(".time-choice")
    ) {
      return;
    }

    handleTextAction();
  };

  /**
   * 统一的文本操作处理
   */
  const handleTextAction = () => {
    const typingComponent = getTypingComponent(currentLineIndex.value);

    if (typingComponent) {
      // 检查是否正在显示
      if (typingComponent.isTyping === true) {
        // 如果正在显示，快速显示完当前行
        skipCurrentLine();
      } else if (typingComponent.isComplete === true) {
        // 如果当前行已完成，显示下一行
        showNextLine();
      }
    } else {
      // 如果没有 TypingText 组件（比如选择分支、输入框或时间匹配分支），检查是否需要等待输入
      const currentLine = displayedLines.value[currentLineIndex.value];
      // choice 行不能被跳过，必须做出选择
      if (currentLine?.type === "choice") {
        return; // 阻止跳过选择
      }
      if (currentLine?.type !== "input" && currentLine?.type !== "timeChoice") {
        showNextLine();
      }
    }
  };

  return {
    handleGlobalKeyDown,
    handleTextClick,
    handleTextAction,
  };
}
