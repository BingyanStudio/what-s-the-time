import { useEffect, useRef } from "react";
import {
  choiceService,
  commandService,
  displayService,
  inputService,
  navigationService,
  sideEffectExecutor,
  timeChoiceService,
} from "@/engine";
import { useGameStore } from "@/hooks/useGameStore";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import type { ChoiceLine, CommandLine, DisplayedLine } from "@/types";
import { WatchDisplay } from "@/ui/display/WatchDisplay";
import { LineRenderer } from "@/ui/lines/LineRenderer";
import type { TypingTextHandle } from "@/ui/shared/TypingText";
import { BackToStartButton } from "./BackToStartButton";

/** 组合游戏引擎、显示进度与全部玩家交互。 */
export function GameView() {
  const { displayState, gameState } = useGameStore();
  const textContainerRef = useRef<HTMLDivElement>(null);
  const lineRefs = useRef(new Map<number, HTMLDivElement>());
  const allLinesComplete = displayService.isAllLinesComplete();
  const showBackButton =
    allLinesComplete && displayState.currentSegment?.id !== "START";

  useEffect(() => {
    sideEffectExecutor.init();
    navigationService.navigateToStart();
  }, []);

  useEffect(() => {
    const container = textContainerRef.current;
    const line = lineRefs.current.get(displayState.currentLineIndex);
    if (!container || !line) return;
    const timer = window.setTimeout(() => {
      const containerRect = container.getBoundingClientRect();
      const lineRect = line.getBoundingClientRect();
      const top =
        container.scrollTop +
        lineRect.top -
        containerRect.top -
        containerRect.height / 2;
      container.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [displayState.currentLineIndex]);

  const backToStart = () => navigationService.navigateToStart();
  const keyboard = useKeyboardNavigation({
    showNextLine: () => displayService.showNextLine(),
    backToStart,
    isAllLinesComplete: allLinesComplete,
    skipCurrentLine: () => displayService.skipCurrentLine(),
    getTypingComponent: (index) => displayService.getTypingComponent(index),
    currentLineIndex: displayState.currentLineIndex,
    displayedLines: displayState.displayedLines,
  });

  useEffect(() => {
    window.addEventListener("keydown", keyboard.handleGlobalKeyDown);
    return () =>
      window.removeEventListener("keydown", keyboard.handleGlobalKeyDown);
  }, [keyboard.handleGlobalKeyDown]);

  const onLineComplete = () => {
    const { displayedLines, currentLineIndex } = displayState;
    const currentLine = displayedLines[currentLineIndex];
    if (currentLine) displayService.completeLine(currentLine.id);
    const nextLine = displayedLines[currentLineIndex + 1];
    if (
      nextLine &&
      ["command", "input", "choice", "timeChoice", "timeDisplay"].includes(
        nextLine.type,
      )
    ) {
      displayService.showNextLine();
    }
  };

  const onChoice = (
    choice: ChoiceLine["choices"][0],
    lineIndex: number,
    choiceIndex: number,
  ) => {
    const line = displayState.displayedLines[lineIndex];
    if (line) choiceService.handleChoice(choice, line.id, choiceIndex);
  };

  const onTimeChoice = (time: string, lineIndex: number) => {
    const line = displayState.displayedLines[lineIndex];
    if (line) timeChoiceService.handleTimeChoice(time, line.id);
  };

  const onInputComplete = (time: string, lineIndex: number) => {
    const line = displayState.displayedLines[lineIndex];
    if (line) inputService.handleInputComplete(time, line.id);
  };

  const onCommand = (command: CommandLine, lineIndex: number) => {
    commandService.handleCommand(command, lineIndex);
  };

  const onTypingRef = (value: TypingTextHandle | null, lineIndex: number) => {
    displayService.setTypingRef(value, lineIndex);
  };

  const shouldShowLine = (line: DisplayedLine, index: number) =>
    line.status === "completed" || index <= displayState.currentLineIndex;

  return (
    <main className="game-view">
      <WatchDisplay displayTime={gameState.currentTime} />
      <div
        ref={textContainerRef}
        className="text-container"
        role="application"
        aria-label="文字冒险游戏区域"
        onClick={keyboard.handleTextClick}
        onKeyDown={() => undefined}
      >
        {displayState.currentSegment && (
          <div className="text-content">
            {displayState.displayedLines.map(
              (line, index) =>
                shouldShowLine(line, index) && (
                  <LineRenderer
                    key={line.id}
                    ref={(element) => {
                      if (element) lineRefs.current.set(index, element);
                      else lineRefs.current.delete(index);
                    }}
                    line={line}
                    index={index}
                    currentLineIndex={displayState.currentLineIndex}
                    onTypingRef={onTypingRef}
                    onLineComplete={onLineComplete}
                    onChoice={onChoice}
                    onTimeChoice={onTimeChoice}
                    onInputComplete={onInputComplete}
                    onCommand={onCommand}
                  />
                ),
            )}
            {showBackButton && <BackToStartButton onClick={backToStart} />}
          </div>
        )}
      </div>
    </main>
  );
}
