/**
 * AST Builder - 语法构建
 *
 * 将 TokenSegment 转换为 ScriptSegment。
 * 文本直接解析为 TextNode[]，选择项使用片段引用。
 */

import type {
  ChoiceLine,
  ContentLine,
  ScriptSegment,
  TokenSegment,
} from "@/types";
import { ParseError } from "@/types";
import { parseText } from "./text-parser";

export class ScriptAstBuilder {
  /** 构建 ScriptSegment */
  build(token: TokenSegment): ScriptSegment {
    const { metadata, content, subSegments } = token;
    const lines = this.parseLines(content, subSegments, metadata.id);

    return {
      id: metadata.id,
      time: metadata.time,
      description: metadata.description,
      loop: metadata.loop,
      unlockFlags: metadata.unlockFlags,
      lines,
    };
  }

  private parseLines(
    lines: string[],
    subSegments: Map<string, string[]>,
    segmentId: string,
  ): ContentLine[] {
    const result: ContentLine[] = [];
    let i = 0;

    while (i < lines.length) {
      if (!lines[i].trim()) {
        i++;
        continue;
      }

      const parsed = this.parseLine(lines, i, segmentId, subSegments);
      if (parsed) {
        result.push(...parsed.lines);
        i += parsed.consumed;
      } else {
        i++;
      }
    }

    return result;
  }

  private parseLine(
    lines: string[],
    index: number,
    segmentId: string,
    subSegments: Map<string, string[]>,
  ): { lines: ContentLine[]; consumed: number } | null {
    const line = lines[index].trim();
    const match = line.match(
      /^(narration|dialogue|input|timeDisplayLine|choice|command)(?:\s+(.+))?$/i,
    );

    if (!match) return null;

    const type = match[1].toLowerCase();
    const extra = match[2];

    switch (type) {
      case "narration":
        return this.parseNarration(extra, lines, index);
      case "dialogue":
        return this.parseDialogue(extra, lines, index);
      case "input":
        return this.parseInput(extra, lines, index);
      case "timedisplayline":
        return this.parseTimeDisplay(extra, index);
      case "choice":
        return this.parseChoice(lines, index, segmentId, subSegments);
      case "command":
        return this.parseCommand(extra, lines, index);
      default:
        return null;
    }
  }

  // ── 旁白 ──────────────────────────────────────────────

  private parseNarration(
    inline: string | undefined,
    lines: string[],
    index: number,
  ): { lines: ContentLine[]; consumed: number } {
    if (inline) {
      return {
        lines: [{ type: "narration", nodes: parseText(inline.trim()) }],
        consumed: 1,
      };
    }
    return this.parseMultilineText("narration", lines, index);
  }

  // ── 对话 ──────────────────────────────────────────────

  private parseDialogue(
    inline: string | undefined,
    lines: string[],
    index: number,
  ): { lines: ContentLine[]; consumed: number } {
    if (inline) {
      return {
        lines: [{ type: "dialogue", nodes: parseText(inline.trim()) }],
        consumed: 1,
      };
    }
    return this.parseMultilineDialogue(lines, index);
  }

  private parseMultilineDialogue(
    lines: string[],
    startIndex: number,
  ): { lines: ContentLine[]; consumed: number } {
    let i = startIndex + 1;
    const parts: string[] = [];
    let character: string | undefined;

    const firstLine = lines[i]?.trim();
    if (firstLine && !this.isTypeLine(firstLine) && !firstLine.startsWith("#") && !firstLine.startsWith(">")) {
      // 角色名检测：冒号前不能包含格式标记字符 { } * = |
      const charMatch = firstLine.match(/^([^:{}*=|]+):/);
      if (charMatch && charMatch[1].trim().length > 0) {
        character = charMatch[1].trim();
        const rest = firstLine.slice(charMatch[0].length).trim();
        if (rest) {
          parts.push(rest);
        }
        i++;
      } else {
        parts.push(firstLine);
        i++;
      }
    }

    while (i < lines.length) {
      const line = lines[i].trim();
      if (!line || this.isTypeLine(line)) break;
      parts.push(line);
      i++;
    }

    return {
      lines: [{ type: "dialogue", character, nodes: parseText(parts.join("\n")) }],
      consumed: i - startIndex,
    };
  }

  // ── 多行文本 ─────────────────────────────────────────

  private parseMultilineText(
    type: "narration",
    lines: string[],
    startIndex: number,
  ): { lines: ContentLine[]; consumed: number } {
    const parts: string[] = [];
    let i = startIndex + 1;

    while (i < lines.length) {
      const line = lines[i].trim();
      if (!line || this.isTypeLine(line)) break;
      parts.push(line);
      i++;
    }

    return {
      lines: [{ type, nodes: parseText(parts.join("\n")) }],
      consumed: i - startIndex,
    };
  }

  // ── 输入 ──────────────────────────────────────────────

  private parseInput(
    inline: string | undefined,
    lines: string[],
    index: number,
  ): { lines: ContentLine[]; consumed: number } {
    let placeholder = inline?.trim();

    if (!placeholder && index + 1 < lines.length) {
      const next = lines[index + 1].trim();
      if (next && !this.isTypeLine(next)) {
        placeholder = next;
        return {
          lines: [{ type: "input", placeholder }],
          consumed: 2,
        };
      }
    }

    return {
      lines: [{ type: "input", placeholder }],
      consumed: 1,
    };
  }

  // ── 时间显示 ──────────────────────────────────────────

  private parseTimeDisplay(
    value: string | undefined,
    index: number,
  ): { lines: ContentLine[]; consumed: number } {
    if (!value) {
      throw new ParseError("timeDisplayLine 需要指定时间值", index);
    }
    return {
      lines: [{ type: "timeDisplay", value: value.trim() }],
      consumed: 1,
    };
  }

  // ── 选择 ──────────────────────────────────────────────

  private parseChoice(
    lines: string[],
    index: number,
    segmentId: string,
    subSegments: Map<string, string[]>,
  ): { lines: ContentLine[]; consumed: number } {
    const choices: ChoiceLine["choices"] = [];
    let i = index + 1;

    while (i < lines.length) {
      const line = lines[i].trim();
      if (!line || !line.startsWith("-")) break;

      const linkMatch = line.match(/-\s*\[([^\]]+)\]\(([^)]+)\)/);
      if (!linkMatch) {
        throw new ParseError(`无效的选项格式: ${line}`, i);
      }

      const text = linkMatch[1];
      const target = linkMatch[2];
      const subMatch = target.match(/^#(.+)$/);

      if (subMatch) {
        const subId = subMatch[1];
        if (!subSegments.has(subId)) {
          throw new ParseError(`未找到子片段: #${subId}`, i, undefined, segmentId);
        }
        // 递归解析子片段的行内容
        const subLines = this.parseLines(
          subSegments.get(subId) as string[],
          subSegments,
          segmentId,
        );
        choices.push({ text, lines: subLines });
      } else {
        const flagMatch = target.match(/^setFlag:(.+)$/);
        if (flagMatch) {
          choices.push({ text, lines: [], setFlag: flagMatch[1] });
        } else {
          throw new ParseError(`无效的选项目标: ${target}`, i);
        }
      }

      i++;
    }

    return {
      lines: [{ type: "choice", choices }],
      consumed: i - index,
    };
  }

  // ── 命令 ──────────────────────────────────────────────

  private parseCommand(
    inline: string | undefined,
    lines: string[],
    index: number,
  ): { lines: ContentLine[]; consumed: number } {
    let commandStr = inline;
    let consumed = 1;

    if (!commandStr && index + 1 < lines.length) {
      commandStr = lines[index + 1].trim();
      consumed = 2;
    }

    if (!commandStr) {
      throw new ParseError("command 需要指定命令类型", index);
    }

    const parts = commandStr.split(/\s+/);
    const cmd = parts[0];
    const params: Record<string, string> = {};

    switch (cmd) {
      case "setFlag":
        if (parts.length < 2) throw new ParseError("setFlag 需要指定flag名称", index);
        params.flag = parts.slice(1).join(" ");
        break;
      case "unsetFlag":
        if (parts.length < 2) throw new ParseError("unsetFlag 需要指定flag名称", index);
        params.flag = parts.slice(1).join(" ");
        break;
      case "jump":
        if (parts.length < 2) throw new ParseError("jump 需要指定目标片段ID", index);
        params.segmentId = parts.slice(1).join(" ");
        break;
      case "end":
      case "return":
        break;
      default:
        throw new ParseError(`未知命令: ${cmd}`, index);
    }

    return {
      lines: [{ type: "command", command: cmd as ContentLine & { type: "command" } extends { command: infer C } ? C : never, params }],
      consumed,
    };
  }

  // ── 工具 ──────────────────────────────────────────────

  private isTypeLine(line: string): boolean {
    return /^(narration|dialogue|input|timeDisplayLine|choice|command)/i.test(line);
  }
}
