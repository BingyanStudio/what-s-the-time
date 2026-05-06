/**
 * Tokenizer - 词法分析
 *
 * 职责：
 * - 按 `---` 分割片段
 * - 解析 YAML Front Matter
 * - 提取 `# 标识` 子片段
 * - 转换延时简写
 * - 过滤注释行
 */

import type { TokenSegment } from "@/types";
import { ParseError } from "@/types";
import { normalizeText } from "./utils/text-normalizer";
import { extractFrontMatter, parseYamlFrontMatter } from "./utils/yaml-parser";

export interface TokenizerOptions {
  keepComments?: boolean;
}

export class ScriptTokenizer {
  private options: Required<TokenizerOptions>;

  constructor(options: TokenizerOptions = {}) {
    this.options = {
      keepComments: options.keepComments ?? false,
    };
  }

  /** Tokenize 整个剧本文件 */
  tokenize(content: string): TokenSegment[] {
    const rawSegments = this.splitSegments(content);
    const segments: TokenSegment[] = [];

    for (let i = 0; i < rawSegments.length; i++) {
      const raw = rawSegments[i];
      if (!raw.trim()) continue;

      try {
        segments.push(this.tokenizeSegment(raw, i + 1));
      } catch (error) {
        if (error instanceof ParseError) throw error;
        throw new ParseError(
          `解析片段失败: ${error instanceof Error ? error.message : String(error)}`,
          i + 1,
        );
      }
    }

    return segments;
  }

  private splitSegments(content: string): string[] {
    const { frontMatter: globalFrontMatter, remainingContent } =
      extractFrontMatter(content);

    if (globalFrontMatter) {
      const segments = remainingContent.split(/^---$/gm);
      return segments
        .map((seg) => {
          const trimmed = seg.trim();
          if (!trimmed) return "";
          if (trimmed.startsWith("---")) return trimmed;
          return `---\n${globalFrontMatter}\n---\n${trimmed}`;
        })
        .filter(Boolean);
    }

    return content.split(/^---$/gm).filter(Boolean);
  }

  private tokenizeSegment(raw: string, index: number): TokenSegment {
    const { frontMatter, remainingContent } = extractFrontMatter(raw);

    if (!frontMatter) {
      throw new ParseError("片段缺少YAML元数据块", index);
    }

    const metadata = parseYamlFrontMatter(frontMatter, `segment-${index}`, index);
    const { mainContent, subSegments } = this.extractSubSegments(remainingContent);

    return { metadata, content: mainContent, subSegments };
  }

  private extractSubSegments(content: string): {
    mainContent: string[];
    subSegments: Map<string, string[]>;
  } {
    const lines = content.split("\n");
    const mainContent: string[] = [];
    const subSegments = new Map<string, string[]>();

    let currentSubId: string | null = null;
    let currentSubLines: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // 子片段标题 `# 标识`
      const match = trimmed.match(/^#\s+(.+)$/);
      if (match) {
        if (currentSubId) {
          subSegments.set(currentSubId, currentSubLines);
        }
        currentSubId = match[1];
        currentSubLines = [];
        continue;
      }

      // 注释行
      if (trimmed.startsWith(">") && !this.options.keepComments) {
        continue;
      }

      if (currentSubId) {
        currentSubLines.push(line);
      } else {
        mainContent.push(line);
      }
    }

    if (currentSubId) {
      subSegments.set(currentSubId, currentSubLines);
    }

    // 规范化文本
    const normalized = mainContent.map(normalizeText);
    const normalizedSubs = new Map<string, string[]>();
    for (const [id, subLines] of subSegments) {
      normalizedSubs.set(id, subLines.map(normalizeText));
    }

    return { mainContent: normalized, subSegments: normalizedSubs };
  }
}
