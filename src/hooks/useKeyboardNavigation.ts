import type { MouseEvent as ReactMouseEvent } from "react";
import type { DisplayedLine } from "@/types";

interface KeyboardNavigationOptions {
  showNextLine: () => void;
  backToStart: () => void;
  isAllLinesComplete: boolean;
  skipCurrentLine: () => void;
  getTypingComponent: (index: number) => any;
  currentLineIndex: number;
  displayedLines: DisplayedLine[];
}

/** 统一处理键盘推进、点击推进与打字跳过。 */
export function useKeyboardNavigation(options: KeyboardNavigationOptions) {
  const handleTextAction = () => {
    const typing = options.getTypingComponent(options.currentLineIndex);
    if (typing?.isTyping) options.skipCurrentLine();
    else if (typing?.isComplete) options.showNextLine();
    else {
      const line = options.displayedLines[options.currentLineIndex];
      if (
        line?.type !== "choice" &&
        line?.type !== "input" &&
        line?.type !== "timeChoice"
      ) {
        options.showNextLine();
      }
    }
  };

  const handleGlobalKeyDown = (event: KeyboardEvent) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const target = event.target as HTMLElement;
    if (
      target.closest(
        "input, textarea, select, button, [contenteditable='true'], .time-input-char, .back-button",
      )
    ) {
      return;
    }
    event.preventDefault();
    if (options.isAllLinesComplete) options.backToStart();
    else handleTextAction();
  };

  const handleTextClick = (event: ReactMouseEvent) => {
    const target = event.target as HTMLElement;
    if (
      target.closest(
        ".choice-button, .time-input-char, .back-button, .input-line, .time-choice",
      )
    ) {
      return;
    }
    handleTextAction();
  };

  return { handleGlobalKeyDown, handleTextClick };
}
