/**
 * 命令服务
 *
 * 处理 command 行的执行逻辑。
 */

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
          navigationService.navigateToSegment(command.params.segmentId);
          return; // jump 会加载新片段，不需要推进
        }
        break;
      }
      case "end":
        break;
      case "return":
        break;
    }

    // 自动推进到下一行
    const nextIndex = lineIndex + 1;
    if (nextIndex < displayState.displayedLines.length) {
      stateStore.updateDisplayState({
        currentLineIndex: nextIndex,
        pendingSideEffects: [{ type: "startTyping", target: nextIndex, delay: 0 }],
      });
    }
  }
}

export const commandService = new CommandService();
