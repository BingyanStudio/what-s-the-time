import { type ForwardedRef, forwardRef, useEffect, useRef } from "react";
import type { ChoiceLine, CommandLine, DisplayedLine, TextNode } from "@/types";
import { TimeDisplay } from "@/ui/display/TimeDisplay";
import { TimeInput } from "@/ui/input/TimeInput";
import { FormattedText } from "@/ui/shared/FormattedText";
import { TypingText, type TypingTextHandle } from "@/ui/shared/TypingText";

interface LineRendererProps {
  line: DisplayedLine;
  index: number;
  currentLineIndex: number;
  onTypingRef: (value: TypingTextHandle | null, index: number) => void;
  onLineComplete: () => void;
  onChoice: (
    choice: ChoiceLine["choices"][0],
    lineIndex: number,
    choiceIndex: number,
  ) => void;
  onTimeChoice: (time: string, lineIndex: number) => void;
  onInputComplete: (time: string, lineIndex: number) => void;
  onCommand: (command: CommandLine, lineIndex: number) => void;
}

const commandDescription = (line: CommandLine): string => {
  if (line.command === "setFlag")
    return `设置 flag: ${line.params.flag || "N/A"}`;
  if (line.command === "unsetFlag")
    return `取消 flag: ${line.params.flag || "N/A"}`;
  if (line.command === "jump")
    return `跳转到: ${line.params.segmentId || "N/A"}`;
  if (line.command === "end") return "结束游戏";
  return "返回上一层";
};

function CommandContent({
  line,
  index,
  onCommand,
}: {
  line: DisplayedLine & CommandLine;
  index: number;
  onCommand: LineRendererProps["onCommand"];
}) {
  const executed = useRef(false);
  const callback = useRef(onCommand);
  callback.current = onCommand;
  useEffect(() => {
    if (executed.current) return;
    executed.current = true;
    callback.current(line, index);
  }, [index, line]);
  return (
    <div className="command-line">
      <span className="command-debug">
        [CMD: {line.command}] {commandDescription(line)}
      </span>
    </div>
  );
}

function TextContent({
  nodes,
  index,
  currentLineIndex,
  onTypingRef,
  onLineComplete,
}: {
  nodes: TextNode[];
  index: number;
  currentLineIndex: number;
  onTypingRef: LineRendererProps["onTypingRef"];
  onLineComplete: () => void;
}) {
  if (index > currentLineIndex) return null;
  if (index < currentLineIndex) return <FormattedText nodes={nodes} />;
  return (
    <TypingText
      nodes={nodes}
      ref={(value) => onTypingRef(value, index)}
      onComplete={onLineComplete}
    />
  );
}

function LineRendererInner(
  props: LineRendererProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  const { line, index, currentLineIndex } = props;
  const disabled = line.status === "completed" || line.status === "disabled";

  let content: React.ReactNode = null;
  if (line.type === "narration" || line.type === "text") {
    content = (
      <div className="narration">
        <TextContent
          nodes={line.nodes}
          index={index}
          currentLineIndex={currentLineIndex}
          onTypingRef={props.onTypingRef}
          onLineComplete={props.onLineComplete}
        />
      </div>
    );
  } else if (line.type === "dialogue") {
    content = (
      <div className="dialogue">
        {line.character && (
          <span className="character-name">{line.character}</span>
        )}
        <div
          className={`dialogue-text${line.character ? " with-character" : ""}`}
        >
          <TextContent
            nodes={line.nodes}
            index={index}
            currentLineIndex={currentLineIndex}
            onTypingRef={props.onTypingRef}
            onLineComplete={props.onLineComplete}
          />
        </div>
      </div>
    );
  } else if (line.type === "choice") {
    content = (
      <div className="choices">
        {line.choices.map((choice, choiceIndex) => {
          const selected = disabled && line.selectedChoiceIndex === choiceIndex;
          const className = [
            "choice-button",
            disabled && "choice-button-disabled",
            selected && "choice-button-selected",
            disabled && !selected && "choice-button-unselected",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <button
              key={JSON.stringify(choice)}
              type="button"
              disabled={disabled}
              className={className}
              onClick={(event) => {
                event.stopPropagation();
                if (!disabled) props.onChoice(choice, index, choiceIndex);
              }}
            >
              {choice.text}
            </button>
          );
        })}
      </div>
    );
  } else if (line.type === "timeChoice") {
    content = (
      <div className="time-choice">
        <TimeInput
          autoFocus={index === currentLineIndex}
          disabled={disabled}
          onComplete={(time) => props.onTimeChoice(time, index)}
        />
      </div>
    );
  } else if (line.type === "input") {
    content = (
      <div className="input-line">
        <TimeInput
          autoFocus={index === currentLineIndex}
          disabled={disabled}
          onComplete={(time) => props.onInputComplete(time, index)}
        />
      </div>
    );
  } else if (line.type === "timeDisplay") {
    content = (
      <div className="time-display-line">
        <TimeDisplay time={line.value} />
      </div>
    );
  } else if (line.type === "command") {
    content = (
      <CommandContent line={line} index={index} onCommand={props.onCommand} />
    );
  }

  return <div ref={ref}>{content}</div>;
}

export const LineRenderer = forwardRef(LineRendererInner);
