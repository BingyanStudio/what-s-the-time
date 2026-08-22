import { describe, expect, it } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseScript } from "@/parser";

const segmentDirectory = fileURLToPath(new URL("../segments", import.meta.url));
const segmentFiles = readdirSync(segmentDirectory).filter((file) =>
  file.endsWith(".md"),
);
const segments = segmentFiles.map((file) =>
  parseScript(readFileSync(`${segmentDirectory}/${file}`, "utf8"), file),
);

describe("正式剧本数据", () => {
  it("全部 Markdown 片段都能解析且 ID 唯一", () => {
    expect(segments).toHaveLength(segmentFiles.length);
    expect(new Set(segments.map((segment) => segment.id)).size).toBe(
      segments.length,
    );
  });

  it("包含可进入游戏所需的起点和兜底片段", () => {
    const ids = new Set(segments.map((segment) => segment.id));
    expect(ids.has("START")).toBe(true);
    expect(ids.has("START-FIRST")).toBe(true);
    expect(ids.has("BLANK")).toBe(true);
  });

  it("迁移后仍覆盖输入、选择、命令和动态文本剧本能力", () => {
    const lines = segments.flatMap((segment) => segment.lines);
    expect(lines.some((line) => line.type === "input")).toBe(true);
    expect(lines.some((line) => line.type === "choice")).toBe(true);
    expect(lines.some((line) => line.type === "command")).toBe(true);
    expect(
      lines.some(
        (line) =>
          "nodes" in line &&
          line.nodes.some((node) => node.type === "animateText"),
      ),
    ).toBe(true);
  });
});
