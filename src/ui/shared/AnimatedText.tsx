import { useEffect, useMemo, useState } from "react";
import type { TextNode } from "@/types";
import { getAnimatedTextWidth } from "./text-format";

const PAUSE = 300;
const STEP = 100;

/** 循环执行“删除—切换—输入”的动态文本。 */
export function AnimatedText({ node }: { node: TextNode }) {
  const texts = node.animateTexts?.length ? node.animateTexts : [node.content];
  const [index, setIndex] = useState(0);
  const [length, setLength] = useState(texts[0]?.length ?? 0);
  const [phase, setPhase] = useState<"pause" | "delete" | "type">("pause");
  const minWidth = useMemo(() => getAnimatedTextWidth(texts), [texts]);

  useEffect(() => {
    if (texts.length < 2) return;
    const delay = phase === "pause" ? PAUSE : STEP;
    const timer = window.setTimeout(() => {
      if (phase === "pause") setPhase("delete");
      else if (phase === "delete" && length > 0) setLength(length - 1);
      else if (phase === "delete") {
        const next = (index + 1) % texts.length;
        setIndex(next);
        setPhase("type");
      } else if (length < texts[index].length) setLength(length + 1);
      else setPhase("pause");
    }, delay);
    return () => window.clearTimeout(timer);
  }, [index, length, phase, texts]);

  return (
    <span className="animate-text-container" style={{ width: `${minWidth}em` }}>
      {texts[index].slice(0, length)}
      {phase !== "pause" && <span className="typing-cursor">▮</span>}
    </span>
  );
}
