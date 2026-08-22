/**
 * 命令服务
 *
 * 处理 command 行的执行逻辑。
 */

import { parseText } from "@/parser";
import type { CommandLine } from "@/types";
import { navigationService } from "./navigation-service";
import { stateStore } from "./state-store";

class CommandService {
  handleCommand(command: CommandLine, lineIndex: number): void {
    const { displayState } = stateStore._internal;
    const line = displayState.displayedLines[lineIndex];
    if (line) stateStore.updateLineState(line.id, "completed");

    switch (command.command) {
      case "setFlag": {
        if (command.params.flag) {
          const flags = new Set(stateStore._internal.gameState.unlockedFlags);
          flags.add(command.params.flag);
          stateStore.updateGameState({ unlockedFlags: flags });
        }
        break;
      }
      case "unsetFlag": {
        if (command.params.flag) {
          const flags = new Set(stateStore._internal.gameState.unlockedFlags);
          flags.delete(command.params.flag);
          stateStore.updateGameState({ unlockedFlags: flags });
        }
        break;
      }
      case "jump": {
        if (command.params.segmentId) {
          if (/^\d{2}:\d{2}$/.test(command.params.segmentId)) {
            navigationService.navigateToTime(command.params.segmentId);
          } else {
            navigationService.navigateToSegment(command.params.segmentId);
          }
          return; // jump 会加载新片段，不需要推进
        }
        break;
      }
      case "end": {
        const displayedLines = displayState.displayedLines.map((item, index) =>
          index > lineIndex ? { ...item, status: "disabled" as const } : item,
        );
        const lineStates = new Map(stateStore.lineStates);
        for (const item of displayedLines.slice(lineIndex + 1)) {
          lineStates.set(item.id, "disabled");
        }
        if (command.params.message) {
          displayedLines[lineIndex] = {
            type: "narration",
            nodes: parseText(command.params.message),
            id: line.id,
            status: "pending",
          };
          lineStates.set(line.id, "pending");
          stateStore.batchUpdate({
            displayState: {
              ...displayState,
              displayedLines,
              pendingSideEffects: [
                { type: "startTyping", target: lineIndex, delay: 0 },
              ],
            },
            lineStates,
          });
        } else {
          stateStore.batchUpdate({
            displayState: { ...displayState, displayedLines },
            lineStates,
          });
        }
        return;
      }
      case "return":
        // TODO return 需要片段导航栈；当前剧本尚未使用此命令。
        break;
    }

    // 自动推进到下一行
    const nextIndex = lineIndex + 1;
    if (nextIndex < displayState.displayedLines.length) {
      stateStore.updateDisplayState({
        currentLineIndex: nextIndex,
        pendingSideEffects: [
          { type: "startTyping", target: nextIndex, delay: 0 },
        ],
      });
    }
  }
}

export const commandService = new CommandService();
