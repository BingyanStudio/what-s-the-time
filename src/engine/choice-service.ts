/**
 * 选择服务
 *
 * 处理 choice 行的选择逻辑。
 * 选择后将内联行插入到当前显示列表中。
 */

import type { ChoiceLine, ContentLine, DisplayedLine, LineStatus } from "@/types";
import { stateStore } from "./state-store";

class ChoiceService {
  handleChoice(
    choice: ChoiceLine["choices"][0],
    lineId: string,
    choiceIndex: number,
  ): void {
    const { displayState, gameState, lineStates } = stateStore._internal;

    const status = lineStates.get(lineId);
    if (status === "completed" || status === "disabled") return;

    const lineIndex = displayState.displayedLines.findIndex((l) => l.id === lineId);
    if (lineIndex === -1) return;

    // 标记行为已完成
    stateStore.updateLineState(lineId, "completed");

    // 设置 flag
    if (choice.setFlag) {
      const flags = new Set(gameState.unlockedFlags);
      flags.add(choice.setFlag);
      stateStore.updateGameState({ unlockedFlags: flags });
    }

    // 记录选择历史
    gameState.choiceHistory.push({
      choiceText: choice.text,
      timestamp: Date.now(),
    });

    // 更新选中状态 + 插入内联行
    const displayedLines = [...displayState.displayedLines];
    const line = displayedLines[lineIndex];
    if (line) {
      displayedLines[lineIndex] = {
        ...line,
        status: "completed" as LineStatus,
        selectedChoiceIndex: choiceIndex,
      } as DisplayedLine;
    }

    // 将 choice.lines 转为 DisplayedLine 并插入
    const newLines = this.createDisplayedLines(choice.lines, lineIndex);
    displayedLines.splice(lineIndex + 1, 0, ...newLines);

    // 初始化新行状态
    const newLineStates = new Map<string, LineStatus>();
    for (const l of newLines) {
      newLineStates.set(l.id, "pending");
    }
    stateStore.updateLineStates(newLineStates);

    stateStore.updateDisplayState({
      displayedLines,
      currentLineIndex: lineIndex + 1,
      pendingSideEffects: [{ type: "startTyping", target: lineIndex + 1, delay: 0 }],
    });
  }

  private createDisplayedLines(lines: ContentLine[], baseIndex: number): DisplayedLine[] {
    return lines.map((line, index) => ({
      ...line,
      id: `inserted-${baseIndex}-${index}`,
      status: "pending" as LineStatus,
    }));
  }
}

export const choiceService = new ChoiceService();
