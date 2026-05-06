/**
 * 时间选择服务
 *
 * 处理 timeChoice 行的匹配逻辑。
 * 匹配后替换为 timeDisplay 行并插入内联后续内容。
 */

import type { ContentLine, DisplayedLine, LineStatus } from "@/types";
import { useSystemTime } from "@/composables/useSystemTime";
import { stateStore } from "./state-store";

class TimeChoiceService {
  handleTimeChoice(time: string, lineId: string): void {
    const { displayState, gameState } = stateStore._internal;

    const line = displayState.displayedLines.find((l) => l.id === lineId);
    if (!line || line.type !== "timeChoice") return;

    const status = stateStore.lineStates.get(lineId);
    if (status === "completed" || status === "disabled") return;

    const { getCurrentSystemTime } = useSystemTime();
    const systemTime = getCurrentSystemTime();

    // 查找匹配的选项
    let matched: (typeof line)["choices"][0] | null = null;
    for (const choice of line.choices) {
      if (choice.time === "*") { matched = choice; break; }
      if (choice.time === "NOW" && time === systemTime) { matched = choice; break; }
      if (choice.time === time) { matched = choice; break; }
    }
    if (!matched) return;

    // 更新状态
    stateStore.updateLineState(lineId, "completed");

    if (matched.setFlag) {
      const flags = new Set(gameState.unlockedFlags);
      flags.add(matched.setFlag);
      stateStore.updateGameState({ unlockedFlags: flags });
    }

    gameState.choiceHistory.push({ choiceText: `时间: ${time}`, timestamp: Date.now() });

    // 替换 timeChoice 为 timeDisplay + 插入内联行
    const lineIndex = displayState.displayedLines.findIndex((l) => l.id === lineId);
    if (lineIndex === -1) return;

    const displayedLines = [...displayState.displayedLines];
    displayedLines[lineIndex] = {
      type: "timeDisplay",
      value: time,
      id: lineId,
      status: "completed" as LineStatus,
    } as DisplayedLine;

    const insertIndex = lineIndex + 1;
    const newLines = this.createDisplayedLines(matched.lines, insertIndex);
    displayedLines.splice(insertIndex, 0, ...newLines);

    const lineStates = new Map<string, LineStatus>();
    for (const l of newLines) lineStates.set(l.id, "pending");
    stateStore.updateLineStates(lineStates);

    stateStore.updateDisplayState({
      displayedLines,
      currentLineIndex: insertIndex,
      pendingSideEffects: [{ type: "startTyping", target: insertIndex, delay: 0 }],
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

export const timeChoiceService = new TimeChoiceService();
