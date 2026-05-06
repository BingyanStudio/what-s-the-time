/**
 * 剧本数据加载器
 *
 * 从 .md 文件加载所有剧本片段，解析为 ScriptSegment。
 * 使用 Vite 的 import.meta.glob 在构建时收集所有 .md 文件。
 */

import type { ScriptSegment } from "@/types";
import { ScriptParser } from "@/parser";

const parser = new ScriptParser({ enableCache: true });

/** 加载并解析所有 .md 剧本文件 */
function loadAllSegments(): ScriptSegment[] {
  const modules = import.meta.glob("./segments/*.md", {
    eager: true,
    query: "?raw",
    import: "default",
  });

  const segments: ScriptSegment[] = [];

  for (const [path, raw] of Object.entries(modules)) {
    try {
      const content = raw as string;
      const parsed = parser.parseAll(content);
      segments.push(...parsed);
    } catch (e) {
      console.warn(`解析失败 ${path}:`, e);
    }
  }

  return segments;
}

/** 所有剧本片段 */
export const scriptSegments: ScriptSegment[] = loadAllSegments();

/** 根据当前 loop 获取开始片段 */
export function getStartSegment(loop?: string): ScriptSegment {
  if (loop === "A") {
    const first = scriptSegments.find((s) => s.id === "START-FIRST");
    if (first) return first;
  }
  if (loop === "G") {
    const meta = scriptSegments.find((s) => s.id === "P09-02");
    if (meta) return meta;
  }
  return scriptSegments.find((s) => s.id === "START") as ScriptSegment;
}

/** 检查解锁条件 */
function checkUnlockConditions(
  segment: ScriptSegment,
  unlockedFlags: Set<string>,
): boolean {
  if (!segment.unlockFlags || segment.unlockFlags.length === 0) return true;
  return segment.unlockFlags.every((flag) => unlockedFlags.has(flag));
}

/** 根据时间和条件查找片段 */
export function findSegment(
  time: string,
  unlockedFlags: Set<string> = new Set(),
  _viewedSegments?: Set<string>,
): ScriptSegment | null {
  const match = scriptSegments.find(
    (seg) => seg.time === time && checkUnlockConditions(seg, unlockedFlags),
  );
  if (match) return match;
  return scriptSegments.find((seg) => seg.id === "BLANK") || null;
}

/** 根据片段 ID 查找片段 */
export function findSegmentById(segmentId: string): ScriptSegment | null {
  return scriptSegments.find((seg) => seg.id === segmentId) || null;
}
