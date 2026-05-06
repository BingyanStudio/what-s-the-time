/**
 * YAML Front Matter 解析
 */

import yaml from "js-yaml";
import type { SegmentMetadata } from "@/types";
import { ParseError } from "@/types";

/** 解析 YAML Front Matter 为片段元数据 */
export function parseYamlFrontMatter(
  frontMatter: string,
  segmentId = "unknown",
  lineNumber = 1,
): SegmentMetadata {
  try {
    const parsed = yaml.load(frontMatter, {
      schema: yaml.FAILSAFE_SCHEMA,
    }) as Record<string, unknown>;

    if (!parsed.id) {
      throw new ParseError("Missing required field: id", lineNumber, undefined, segmentId);
    }
    if (!parsed.time) {
      throw new ParseError("Missing required field: time", lineNumber, undefined, segmentId);
    }

    const metadata: SegmentMetadata = {
      id: String(parsed.id),
      time: String(parsed.time),
    };

    if (parsed.description !== undefined) {
      metadata.description = String(parsed.description);
    }
    if (parsed.loop !== undefined) {
      metadata.loop = String(parsed.loop);
    }
    if (parsed.unlockFlags !== undefined) {
      metadata.unlockFlags = Array.isArray(parsed.unlockFlags)
        ? parsed.unlockFlags.map((f: unknown) => String(f))
        : [];
    }

    return metadata;
  } catch (error) {
    if (error instanceof ParseError) throw error;
    throw new ParseError(
      `YAML解析失败: ${error instanceof Error ? error.message : String(error)}`,
      lineNumber,
      undefined,
      segmentId,
    );
  }
}

/** 提取 Front Matter 内容 */
export function extractFrontMatter(content: string): {
  frontMatter: string | null;
  remainingContent: string;
} {
  const lines = content.split("\n");

  let startIndex = 0;
  while (startIndex < lines.length && lines[startIndex].trim() === "") {
    startIndex++;
  }

  if (startIndex >= lines.length || lines[startIndex].trim() !== "---") {
    return { frontMatter: null, remainingContent: content };
  }

  let endIndex = -1;
  for (let i = startIndex + 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      endIndex = i;
      break;
    }
  }

  if (endIndex === -1) {
    return { frontMatter: null, remainingContent: content };
  }

  return {
    frontMatter: lines.slice(startIndex + 1, endIndex).join("\n"),
    remainingContent: lines.slice(endIndex + 1).join("\n"),
  };
}
