/**
 * 输入服务
 *
 * 处理 input 行的完成逻辑。
 * 输入完成后直接替换为 timeDisplay 行，然后导航到对应时间片段。
 */

import type { DisplayedLine, LineStatus } from "@/types";
import { navigationService } from "./navigation-service";
import { stateStore } from "./state-store";

class InputService {
  handleInputComplete(time: string, lineId: string): void {
    const { displayState } = stateStore._internal;
    const lineIndex = displayState.displayedLines.findIndex((l) => l.id === lineId);
    if (lineIndex === -1) return;

    const line = displayState.displayedLines[lineIndex];
    if (line?.type !== "input") return;

    // 直接替换为 timeDisplay 行
    const displayedLines = [...displayState.displayedLines];
    displayedLines[lineIndex] = {
      type: "timeDisplay",
      value: time,
      id: line.id,
      status: "completed" as LineStatus,
    } as DisplayedLine;

    stateStore.updateDisplayState({ displayedLines });

    // 导航到时间对应的片段
    navigationService.navigateToTime(time);
  }
}

export const inputService = new InputService();
