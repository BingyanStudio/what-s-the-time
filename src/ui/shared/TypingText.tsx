import {
  Fragment,
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useMechanicalSound } from "@/hooks/useMechanicalSound";
import { useSystemTime } from "@/hooks/useSystemTime";
import type { TextNode } from "@/types";
import { AnimatedText } from "./AnimatedText";
import { getAnimatedTextWidth, getTextClassName } from "./text-format";

export interface TypingTextHandle {
  startTyping: () => void;
  skipToEnd: () => void;
  readonly isTyping: boolean;
  readonly isComplete: boolean;
}

interface TypingTextProps {
  nodes: TextNode[];
  speed?: number;
  autoStart?: boolean;
  onComplete: () => void;
}

const punctuationDelay = (char: string, speed: number): number => {
  if (/[！？]/.test(char)) return speed * 4;
  if (/[。…]/.test(char)) return speed * 3;
  if (/[，、；：]/.test(char)) return speed * 2;
  return speed;
};

/** 逐字显示富文本，并向游戏引擎暴露开始和跳过控制。 */
export const TypingText = forwardRef<TypingTextHandle, TypingTextProps>(
  function TypingText(
    { nodes, speed = 30, autoStart = false, onComplete },
    ref,
  ) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [currentCharIndex, setCurrentCharIndex] = useState(0);
    const [isTyping, setIsTyping] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const stateRef = useRef({ isTyping, isComplete });
    const completeRef = useRef(onComplete);
    const playSound = useMechanicalSound();
    const systemTime = useSystemTime();

    stateRef.current = { isTyping, isComplete };
    completeRef.current = onComplete;

    const startTyping = useCallback(() => {
      if (stateRef.current.isTyping || stateRef.current.isComplete) return;
      setCurrentIndex(0);
      setCurrentCharIndex(0);
      setIsComplete(false);
      setIsTyping(true);
    }, []);

    const skipToEnd = useCallback(() => {
      if (stateRef.current.isComplete) return;
      setCurrentIndex(nodes.length);
      setCurrentCharIndex(0);
      setIsTyping(false);
      setIsComplete(true);
      completeRef.current();
    }, [nodes.length]);

    useImperativeHandle(
      ref,
      () => ({
        startTyping,
        skipToEnd,
        get isTyping() {
          return stateRef.current.isTyping;
        },
        get isComplete() {
          return stateRef.current.isComplete;
        },
      }),
      [skipToEnd, startTyping],
    );

    useEffect(() => {
      if (autoStart) startTyping();
    }, [autoStart, startTyping]);

    useEffect(() => {
      if (!isTyping) return;
      if (currentIndex >= nodes.length) {
        setIsTyping(false);
        setIsComplete(true);
        completeRef.current();
        return;
      }

      const node = nodes[currentIndex];
      if (node.type === "linebreak") {
        setCurrentIndex((value) => value + 1);
        setCurrentCharIndex(0);
        return;
      }

      if (node.type === "delay") {
        const timer = window.setTimeout(
          () => {
            setCurrentIndex((value) => value + 1);
            setCurrentCharIndex(0);
          },
          (node.delayTime ?? 0) * 1_000,
        );
        return () => window.clearTimeout(timer);
      }

      const content =
        node.type === "systemTime"
          ? systemTime
          : node.type === "animateText"
            ? (node.animateTexts?.[0] ?? node.content)
            : node.content;

      if (currentCharIndex < content.length) {
        const char = content[currentCharIndex] ?? "";
        const timer = window.setTimeout(
          () => {
            if (char && !/\s/.test(char)) {
              if (!/[！？。，、；：]/.test(char) || Math.random() < 0.5) {
                playSound();
              }
            }
            setCurrentCharIndex((value) => value + 1);
          },
          punctuationDelay(char, speed),
        );
        return () => window.clearTimeout(timer);
      }

      const timer = window.setTimeout(
        () => {
          setCurrentIndex((value) => value + 1);
          setCurrentCharIndex(0);
        },
        Math.min(content.length * 10, 500),
      );
      return () => window.clearTimeout(timer);
    }, [
      currentCharIndex,
      currentIndex,
      isTyping,
      nodes,
      playSound,
      speed,
      systemTime,
    ]);

    return (
      <span>
        {nodes.map((node, index) => {
          const key = `${node.type}-${index}`;
          if (node.type === "linebreak") return <br key={key} />;
          if (node.type === "delay") return <Fragment key={key} />;
          const completed = index < currentIndex || isComplete;
          const active = index === currentIndex && isTyping;

          if (node.type === "animateText" && completed) {
            return <AnimatedText key={key} node={node} />;
          }

          const content =
            node.type === "systemTime"
              ? systemTime
              : node.type === "animateText"
                ? (node.animateTexts?.[0] ?? node.content)
                : node.content;
          const text = completed
            ? content
            : active
              ? content.slice(0, currentCharIndex)
              : "";
          const className =
            node.type === "animateText"
              ? "animate-text-container"
              : getTextClassName({
                  ...node,
                  formats:
                    !completed && node.formats?.includes("strike")
                      ? node.formats.filter((format) => format !== "strike")
                      : node.formats,
                  type:
                    !completed && node.type === "strike" ? "text" : node.type,
                });
          const style =
            node.type === "animateText"
              ? {
                  width: `${getAnimatedTextWidth(
                    node.animateTexts ?? [node.content],
                  )}em`,
                }
              : undefined;

          return (
            <span key={key} className={className} style={style}>
              {text}
              {active && currentCharIndex < content.length && (
                <span className="typing-cursor">▮</span>
              )}
            </span>
          );
        })}
      </span>
    );
  },
);
