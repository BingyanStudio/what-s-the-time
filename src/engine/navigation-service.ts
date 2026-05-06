/**
 * 导航服务
 *
 * 管理片段间的导航和时间匹配。
 */

import type { DisplayedLine, LineStatus, ScriptSegment } from "@/types";
import { findSegment, findSegmentById, getStartSegment } from "@/data";
import { stateStore } from "./state-store";

class NavigationService {
  /** 导航到指定片段 */
  navigateToSegment(segmentId: string): void {
    const segment = findSegmentById(segmentId);
    if (!segment) return;
    this.loadSegment(segment);
  }

  /** 导航到时间对应的片段 */
  navigateToTime(time: string): void {
    const { gameState } = stateStore._internal;
    const segment = findSegment(time, gameState.unlockedFlags, gameState.viewedSegments);

    if (segment) {
      gameState.viewedSegments.add(segment.id);
      this.loadSegment(segment);
      stateStore.updateGameState({ currentTime: time });
    } else {
      const blank = findSegment("*");
      if (blank) {
        this.loadSegment(blank);
        stateStore.updateGameState({ currentTime: time });
      }
    }
  }

  /** 导航到开始片段 */
  navigateToStart(): void {
    const { gameState } = stateStore._internal;
    const segment = getStartSegment(gameState.currentLoop);
    this.loadSegment(segment);
  }

  private loadSegment(segment: ScriptSegment): void {
    const lineStates = stateStore._internal.lineStates;
    segment.lines.forEach((_, i) => lineStates.delete(`${segment.id}-${i}`));

    const displayedLines: DisplayedLine[] = segment.lines.map((line, i) => ({
      ...line,
      id: `${segment.id}-${i}`,
      status: "pending" as LineStatus,
      selectedChoiceIndex: undefined,
    }));

    const newLineStates = new Map<string, LineStatus>();
    for (const line of displayedLines) {
      newLineStates.set(line.id, "pending");
    }

    stateStore.batchUpdate({
      displayState: {
        currentSegment: segment,
        currentLineIndex: 0,
        displayedLines,
        typingRefs: new Map(),
        pendingSideEffects: [{ type: "startTyping", target: 0, delay: 0 }],
      },
      lineStates: newLineStates,
    });
  }
}

export const navigationService = new NavigationService();
