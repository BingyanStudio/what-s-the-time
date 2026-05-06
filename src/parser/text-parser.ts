/**
 * 文本解析器
 *
 * 将带格式标记的原始文本解析为 TextNode[] 数组。
 * 支持的标记：{bold}, {red}, {italic}, {blur}, {strike},
 *            {delay:N}, {br}, {systemTime}, {typewriter}texts{/typewriter}
 */

import type { TextFormat, TextNode } from "@/types";

/**
 * 解析文本为 TextNode 数组
 */
export function parseText(
  text: string,
  parentFormats: TextFormat[] = [],
): TextNode[] {
  const nodes: TextNode[] = [];
  let i = 0;
  let currentText = "";
  const formatStack = [...parentFormats];

  const flushText = () => {
    if (currentText) {
      nodes.push({
        type: "text",
        content: currentText,
        formats: formatStack.length > 0 ? [...formatStack] : undefined,
      });
      currentText = "";
    }
  };

  while (i < text.length) {
    // 换行符 → linebreak 节点
    if (text[i] === "\n") {
      flushText();
      nodes.push({ type: "linebreak", content: "" });
      i++;
      continue;
    }

    // {tag} 标记
    if (text[i] === "{") {
      const tagEnd = text.indexOf("}", i);
      if (tagEnd === -1) {
        currentText += text[i];
        i++;
        continue;
      }

      const tagContent = text.substring(i + 1, tagEnd);

      // {br} → linebreak
      if (tagContent === "br") {
        flushText();
        nodes.push({ type: "linebreak", content: "" });
        i = tagEnd + 1;
        continue;
      }

      // {delay:N}
      if (tagContent.startsWith("delay:")) {
        flushText();
        const delayTime = Number.parseFloat(tagContent.substring(6));
        nodes.push({
          type: "delay",
          content: "",
          delayTime: Number.isNaN(delayTime) ? 0.5 : delayTime,
        });
        i = tagEnd + 1;
        continue;
      }

      // {systemTime}
      if (tagContent === "systemTime") {
        flushText();
        nodes.push({ type: "systemTime", content: "" });
        i = tagEnd + 1;
        continue;
      }

      // {typewriter}...{/typewriter} → animateText
      if (tagContent === "typewriter") {
        flushText();
        const endTag = "{/typewriter}";
        const endIndex = text.indexOf(endTag, tagEnd + 1);
        if (endIndex !== -1) {
          const innerText = text.substring(tagEnd + 1, endIndex);
          const animateTexts = innerText.split(",").map((t) => t.trim());
          nodes.push({
            type: "animateText",
            content: animateTexts[0] || "",
            animateTexts,
          });
          i = endIndex + endTag.length;
        } else {
          i = tagEnd + 1;
        }
        continue;
      }

      // 结束标签 {/format}
      if (tagContent.startsWith("/")) {
        const formatType = tagContent.substring(1);
        if (formatType === "typewriter") {
          i = tagEnd + 1;
          continue;
        }
        flushText();
        const idx = formatStack.lastIndexOf(formatType as TextFormat);
        if (idx !== -1) {
          formatStack.splice(idx, 1);
        }
        i = tagEnd + 1;
        continue;
      }

      // 格式标签 {red}, {bold}, {italic}, {blur}, {strike}
      if (["red", "bold", "italic", "blur", "strike"].includes(tagContent)) {
        const formatType = tagContent as TextFormat;
        const endTag = `{/${formatType}}`;
        const endIndex = text.indexOf(endTag, tagEnd + 1);

        if (endIndex !== -1) {
          flushText();
          formatStack.push(formatType);
          const innerText = text.substring(tagEnd + 1, endIndex);
          const innerNodes = parseText(innerText, [...formatStack]);
          formatStack.pop();
          nodes.push(...innerNodes);
          i = endIndex + endTag.length;
        } else {
          i = tagEnd + 1;
        }
        continue;
      }

      // 未知标签，当普通文本
      currentText += text[i];
      i++;
      continue;
    }

    currentText += text[i];
    i++;
  }

  flushText();

  // 空文本兜底
  if (nodes.length === 0 && text) {
    nodes.push({
      type: "text",
      content: text,
      formats: parentFormats.length > 0 ? [...parentFormats] : undefined,
    });
  }

  return nodes;
}
