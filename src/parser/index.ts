/**
 * 剧本解析器 - 入口
 *
 * 组合 Tokenizer + AstBuilder，提供统一的解析接口。
 */

import type { ParserOptions, ParseResult, ScriptSegment } from "@/types";
import { ScriptAstBuilder } from "./ast-builder";
import { ScriptTokenizer } from "./tokenizer";

export class ScriptParser {
  private tokenizer: ScriptTokenizer;
  private astBuilder: ScriptAstBuilder;
  private cache = new Map<string, ScriptSegment>();
  private options: ParserOptions;

  constructor(options: ParserOptions = {}) {
    this.options = { enableCache: true, ...options };
    this.tokenizer = new ScriptTokenizer();
    this.astBuilder = new ScriptAstBuilder();
  }

  /** 解析剧本内容 */
  parse(content: string, filePath?: string): ParseResult {
    const cacheKey = filePath || content;
    if (this.options.enableCache && this.cache.has(cacheKey)) {
      return {
        segment: this.cache.get(cacheKey) as ScriptSegment,
        parseTime: 0,
        filePath,
      };
    }

    const start = performance.now();
    const tokens = this.tokenizer.tokenize(content);

    if (tokens.length === 0) {
      throw new Error("剧本内容为空");
    }

    const segment = this.astBuilder.build(tokens[0]);
    const parseTime = performance.now() - start;

    if (this.options.enableCache) {
      this.cache.set(cacheKey, segment);
    }

    return { segment, parseTime, filePath };
  }

  /** 解析多片段剧本 */
  parseAll(content: string): ScriptSegment[] {
    const tokens = this.tokenizer.tokenize(content);
    return tokens.map((token) => this.astBuilder.build(token));
  }

  clearCache(): void {
    this.cache.clear();
  }
}

/** 便捷函数：解析单片段 */
export function parseScript(content: string, filePath?: string): ScriptSegment {
  const parser = new ScriptParser({ enableCache: true });
  return parser.parse(content, filePath).segment;
}

/** 创建解析器实例 */
export function createParser(options?: ParserOptions): ScriptParser {
  return new ScriptParser(options);
}
