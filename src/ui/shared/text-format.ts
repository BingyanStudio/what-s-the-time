import type { TextNode } from "@/types";

/** 将剧本格式节点映射为稳定的 CSS 类名。 */
export function getTextClassName(node: TextNode): string {
  const formats = new Set(node.formats);
  formats.add(node.type as never);
  return [
    formats.has("red") && "text-red",
    formats.has("bold") && "text-bold",
    formats.has("italic") && "text-italic",
    formats.has("blur") && "text-blur",
    formats.has("strike") && "text-strike",
  ]
    .filter(Boolean)
    .join(" ");
}

export function getAnimatedTextWidth(texts: string[]): number {
  const width = (text: string) =>
    [...text].reduce((total, char) => {
      const code = char.codePointAt(0) ?? 0;
      const wide =
        (code >= 0x3400 && code <= 0x9fff) ||
        (code >= 0x20000 && code <= 0x2fa1f) ||
        (code >= 0x3000 && code <= 0x303f) ||
        (code >= 0xff00 && code <= 0xffef);
      return total + (wide ? 1 : 0.5);
    }, 0);
  return Math.max(...texts.map(width)) + 0.75;
}
