import { Fragment } from "react";
import { useSystemTime } from "@/hooks/useSystemTime";
import type { TextNode } from "@/types";
import { AnimatedText } from "./AnimatedText";
import { getTextClassName } from "./text-format";

/** 渲染一组已经完成打字的富文本节点。 */
export function FormattedText({ nodes }: { nodes: TextNode[] }) {
  const systemTime = useSystemTime();
  return (
    <span>
      {nodes.map((node, index) => {
        const key = `${node.type}-${index}`;
        if (node.type === "linebreak") return <br key={key} />;
        if (node.type === "delay") return <Fragment key={key} />;
        if (node.type === "systemTime") {
          return <span key={key}>{systemTime}</span>;
        }
        if (node.type === "animateText") {
          return <AnimatedText key={key} node={node} />;
        }
        return (
          <span key={key} className={getTextClassName(node)}>
            {node.content}
          </span>
        );
      })}
    </span>
  );
}
