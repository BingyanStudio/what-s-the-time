/**
 * 显示服务
 *
 * 管理行的显示进度、打字动画引用和跳过逻辑。
 */

import type { LineStatus } from "@/types";
import { stateStore } from "./state-store";

class DisplayService {
  /** 显示下一行 */
  showNextLine(): void {
    const { displayState } = stateStore._internal;
    const currentIndex = displayState.currentLineIndex;

    // 标记当前行为已完成
    const currentLine = displayState.displayedLines[currentIndex];
    if (currentLine) {
      this.completeLine(currentLine.id);
    }

    const nextIndex = currentIndex + 1;
    if (nextIndex < displayState.displayedLines.length) {
      stateStore.updateDisplayState({
        currentLineIndex: nextIndex,
        pendingSideEffects: [{ type: "startTyping", target: nextIndex, delay: 0 }],
      });
    }
  }

  /** 跳过当前行的打字动画 */
  skipCurrentLine(): void {
    const { displayState } = stateStore._internal;
    const currentIndex = displayState.currentLineIndex;
    const typingComponent = displayState.typingRefs.get(currentIndex);

    if (typingComponent?.skipToEnd) {
      typingComponent.skipToEnd();
    }
  }

  /** 设置打字动画组件引用 */
  setTypingRef(el: unknown, index: number): void {
    const { displayState } = stateStore._internal;
    if (el) {
      displayState.typingRefs.set(index, el);
    }
  }

  /** 获取打字动画组件 */
  getTypingComponent(index: number): unknown {
    return stateStore._internal.displayState.typingRefs.get(index);
  }

  /** 检查所有行是否已完成 */
  isAllLinesComplete(): boolean {
    const { displayState, lineStates } = stateStore._internal;
    if (displayState.displayedLines.length === 0) return false;

    return displayState.displayedLines.every((line) => {
      const status = lineStates.get(line.id);
      return status === "completed" || status === "disabled";
    });
  }

  /** 标记行为已完成 */
  completeLine(lineId: string): void {
    stateStore.updateLineState(lineId, "completed" as LineStatus);
  }
}

export const displayService = new DisplayService();
