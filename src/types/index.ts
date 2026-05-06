/**
 * 类型系统 - 单一真相来源
 *
 * 所有模块（解析、渲染、逻辑）统一依赖此文件。
 */

// ============================================================================
// 文本节点（渲染原子单位）
// ============================================================================

/** 文本格式 */
export type TextFormat = "bold" | "italic" | "red" | "blur" | "strike";

/** 解析后的文本节点，直接用于渲染 */
export interface TextNode {
  type:
    | "text"
    | "bold"
    | "italic"
    | "red"
    | "blur"
    | "strike"
    | "linebreak"
    | "delay"
    | "systemTime"
    | "animateText";
  content: string;
  /** 叠加格式（如同时 bold + red） */
  formats?: TextFormat[];
  /** delay 节点的延时秒数 */
  delayTime?: number;
  /** animateText 节点的文本列表 */
  animateTexts?: string[];
}

// ============================================================================
// 内容行（剧本语义单位）
// ============================================================================

/** 文本行 */
export interface TextLine {
  type: "text";
  nodes: TextNode[];
}

/** 对话行 */
export interface DialogueLine {
  type: "dialogue";
  character?: string;
  nodes: TextNode[];
}

/** 旁白行 */
export interface NarrationLine {
  type: "narration";
  nodes: TextNode[];
}

/** 选择分支行 */
export interface ChoiceLine {
  type: "choice";
  choices: Array<{
    text: string;
    /** 选择后显示的后续内容 */
    lines: ContentLine[];
    setFlag?: string;
  }>;
}

/** 时间匹配分支行 */
export interface TimeChoiceLine {
  type: "timeChoice";
  choices: Array<{
    time: string;
    /** 匹配后显示的后续内容 */
    lines: ContentLine[];
    setFlag?: string;
  }>;
}

/** 输入行 */
export interface InputLine {
  type: "input";
  placeholder?: string;
}

/** 命令行 */
export interface CommandLine {
  type: "command";
  command: "setFlag" | "unsetFlag" | "jump" | "end" | "return";
  params: Record<string, string>;
}

/** 时间显示行 */
export interface TimeDisplayLine {
  type: "timeDisplay";
  value: string;
}

/** 内容行联合类型 */
export type ContentLine =
  | TextLine
  | DialogueLine
  | NarrationLine
  | ChoiceLine
  | TimeChoiceLine
  | InputLine
  | CommandLine
  | TimeDisplayLine;

// ============================================================================
// 运行时状态
// ============================================================================

/** 行状态 */
export type LineStatus = "pending" | "active" | "completed" | "disabled";

/** 显示行 = 内容行 + 运行时状态 */
export type DisplayedLine = ContentLine & {
  /** 唯一标识（格式: segmentId-index） */
  id: string;
  /** 行状态 */
  status: LineStatus;
  /** 已选择的选项索引（仅 choice 类型） */
  selectedChoiceIndex?: number;
};

// ============================================================================
// 剧本片段
// ============================================================================

/** 片段元数据 */
export interface SegmentMetadata {
  id: string;
  time: string;
  description?: string;
  loop?: string;
  unlockFlags?: string[];
}

/** 剧本片段 */
export interface ScriptSegment {
  id: string;
  time: string;
  description?: string;
  loop?: string;
  unlockFlags?: string[];
  lines: ContentLine[];
}

// ============================================================================
// 游戏状态
// ============================================================================

/** 游戏全局状态 */
export interface GameState {
  currentLoop: string;
  unlockedFlags: Set<string>;
  viewedSegments: Set<string>;
  currentTime?: string;
  choiceHistory: Array<{
    choiceText: string;
    timestamp: number;
  }>;
}

/** 显示状态 */
export interface DisplayState {
  currentSegment: ScriptSegment | null;
  currentLineIndex: number;
  displayedLines: DisplayedLine[];
  typingRefs: Map<number, any>;
  pendingSideEffects: SideEffect[];
}

/** 副作用 */
export interface SideEffect {
  type:
    | "startTyping"
    | "focusInput"
    | "scrollToLine"
    | "removeLine"
    | "insertLines";
  target: string | number;
  delay?: number;
  data?: unknown;
}

// ============================================================================
// 解析器
// ============================================================================

/** 解析错误 */
export class ParseError extends Error {
  lineNumber?: number;
  columnNumber?: number;
  segmentId?: string;

  constructor(
    message: string,
    lineNumber?: number,
    columnNumber?: number,
    segmentId?: string,
  ) {
    super(message);
    this.name = "ParseError";
    this.lineNumber = lineNumber;
    this.columnNumber = columnNumber;
    this.segmentId = segmentId;
  }
}

/** Tokenizer 输出的原始片段 */
export interface TokenSegment {
  metadata: SegmentMetadata;
  content: string[];
  subSegments: Map<string, string[]>;
}

/** 解析选项 */
export interface ParserOptions {
  enableCache?: boolean;
  maxNestingDepth?: number;
}

/** 解析结果 */
export interface ParseResult {
  segment: ScriptSegment;
  parseTime: number;
  filePath?: string;
}
