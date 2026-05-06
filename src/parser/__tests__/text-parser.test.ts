import { describe, expect, it } from "bun:test";
import { parseText } from "../text-parser";

describe("文本解析器", () => {
  it("应该解析纯文本", () => {
    const nodes = parseText("你好世界");
    expect(nodes).toHaveLength(1);
    expect(nodes[0].type).toBe("text");
    expect(nodes[0].content).toBe("你好世界");
  });

  it("应该解析换行符", () => {
    const nodes = parseText("第一行\n第二行");
    expect(nodes).toHaveLength(3);
    expect(nodes[0].content).toBe("第一行");
    expect(nodes[1].type).toBe("linebreak");
    expect(nodes[2].content).toBe("第二行");
  });

  it("应该解析 {br} 标记", () => {
    const nodes = parseText("前{br}后");
    expect(nodes).toHaveLength(3);
    expect(nodes[1].type).toBe("linebreak");
  });

  it("应该解析 {delay:N} 标记", () => {
    const nodes = parseText("等待{delay:1.5}继续");
    expect(nodes).toHaveLength(3);
    expect(nodes[1].type).toBe("delay");
    expect(nodes[1].delayTime).toBe(1.5);
  });

  it("应该解析格式标记", () => {
    const nodes = parseText("{bold}粗体{/bold}");
    expect(nodes).toHaveLength(1);
    expect(nodes[0].content).toBe("粗体");
    expect(nodes[0].formats).toContain("bold");
  });

  it("应该解析嵌套格式", () => {
    const nodes = parseText("{bold}{red}粗体红色{/red}{/bold}");
    expect(nodes).toHaveLength(1);
    expect(nodes[0].formats).toContain("bold");
    expect(nodes[0].formats).toContain("red");
  });

  it("应该解析 {systemTime}", () => {
    const nodes = parseText("现在是{systemTime}");
    expect(nodes).toHaveLength(2);
    expect(nodes[1].type).toBe("systemTime");
  });

  it("应该解析 {typewriter} 标记", () => {
    const nodes = parseText("{typewriter}文本A,文本B,文本C{/typewriter}");
    expect(nodes).toHaveLength(1);
    expect(nodes[0].type).toBe("animateText");
    expect(nodes[0].animateTexts).toEqual(["文本A", "文本B", "文本C"]);
  });
});
