import { describe, expect, it } from "bun:test";
import type { ChoiceLine, DialogueLine, NarrationLine } from "@/types";
import { parseScript } from "../index";

describe("剧本解析器", () => {
  it("应该成功解析简单的剧本片段", () => {
    const content = `
---
id: TEST-001
time: START
description: 测试片段
loop: P0
unlockFlags: []
---
narration
这是一段旁白。

dialogue
这是一句对话。
`;

    const segment = parseScript(content);

    expect(segment.id).toBe("TEST-001");
    expect(segment.time).toBe("START");
    expect(segment.description).toBe("测试片段");
    expect(segment.loop).toBe("P0");
    expect(segment.unlockFlags).toEqual([]);
    expect(segment.lines).toHaveLength(2);
  });

  it("NarrationLine 应该包含 nodes 而非 text", () => {
    const content = `
---
id: TEST-002
time: START
---
narration
测试旁白
`;
    const segment = parseScript(content);
    const line = segment.lines[0] as NarrationLine;

    expect(line.type).toBe("narration");
    expect(line).toHaveProperty("nodes");
    expect(line).not.toHaveProperty("text");
    expect(line.nodes[0].content).toBe("测试旁白");
  });

  it("DialogueLine 应该包含 nodes 而非 text", () => {
    const content = `
---
id: TEST-003
time: START
---
dialogue
测试对话
`;
    const segment = parseScript(content);
    const line = segment.lines[0] as DialogueLine;

    expect(line.type).toBe("dialogue");
    expect(line).toHaveProperty("nodes");
    expect(line).not.toHaveProperty("text");
  });

  it("ChoiceLine 应该使用内联 lines 而非 targetSegments", () => {
    const content = `
---
id: TEST-004
time: START
---
choice
- [选项A](#sub1)
- [选项B](#sub2)

# sub1
narration
选项A的内容

# sub2
narration
选项B的内容
`;
    const segment = parseScript(content);
    const line = segment.lines[0] as ChoiceLine;

    expect(line.type).toBe("choice");
    expect(line.choices).toHaveLength(2);
    expect(line.choices[0]).toHaveProperty("lines");
    expect(line.choices[0]).not.toHaveProperty("targetSegments");
    expect(line.choices[0].lines).toHaveLength(1);
    expect(line.choices[0].lines[0].type).toBe("narration");
  });

  it("ChoiceLine 应该支持 setFlag", () => {
    const content = `
---
id: TEST-004b
time: START
---
choice
- [选项A](setFlag:FLAG_A)
- [选项B](#sub1)

# sub1
narration
选项B的内容
`;
    const segment = parseScript(content);
    const line = segment.lines[0] as ChoiceLine;

    expect(line.choices[0].setFlag).toBe("FLAG_A");
    expect(line.choices[0].lines).toHaveLength(0);
    expect(line.choices[1].lines).toHaveLength(1);
  });

  it("应该正确解析命令行", () => {
    const content = `
---
id: TEST-005
time: START
---
command
setFlag FLAG_TEST
`;
    const segment = parseScript(content);
    expect(segment.lines).toHaveLength(1);
    expect(segment.lines[0].type).toBe("command");
  });

  it("应该正确解析输入行", () => {
    const content = `
---
id: TEST-006
time: START
---
input
输入时间 (HH:MM)
`;
    const segment = parseScript(content);
    expect(segment.lines).toHaveLength(1);
    expect(segment.lines[0].type).toBe("input");
  });

  it("DialogueLine 不应将格式标记中的冒号误判为角色名", () => {
    const content = `
---
id: TEST-007
time: START
---
dialogue
不，是{delay:1}  **他**  在问我。

dialogue
{red}时间是:{/red}
`;
    const segment = parseScript(content);

    const line1 = segment.lines[0] as DialogueLine;
    expect(line1.type).toBe("dialogue");
    expect(line1.character).toBeUndefined();
    expect(line1.nodes.length).toBeGreaterThan(0);
    expect(line1.nodes.some((n) => n.type === "delay")).toBe(true);

    const line2 = segment.lines[1] as DialogueLine;
    expect(line2.type).toBe("dialogue");
    expect(line2.character).toBeUndefined();
    expect(line2.nodes[0].formats).toContain("red");
  });

  it("DialogueLine 应正确识别角色名", () => {
    const content = `
---
id: TEST-008
time: START
---
dialogue
旁白:
这是旁白内容
`;
    const segment = parseScript(content);
    const line = segment.lines[0] as DialogueLine;

    expect(line.type).toBe("dialogue");
    expect(line.character).toBe("旁白");
    expect(line.nodes[0].content).toBe("这是旁白内容");
  });
});
