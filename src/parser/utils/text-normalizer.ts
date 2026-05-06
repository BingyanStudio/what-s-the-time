/**
 * 文本规范化
 *
 * 将 Markdown 简写转换为标准标记格式：
 * - | 或 ｜（半角/全角竖线）→ 每个 0.25s delay，按数量累加
 * - **text** → {bold}text{/bold}
 * - ==text== → {blur}text{/blur}
 */

/** 每个竖线对应的延时秒数 */
const DELAY_PER_BAR = 0.25;

/** 规范化延时标记：连续的半角 | 或全角 ｜ 按数量转换为 {delay:N} */
export function normalizeDelayNotation(text: string): string {
  return text.replace(/[|｜]+/g, (match) => {
    const count = match.length;
    const delay = count * DELAY_PER_BAR;
    return `{delay:${delay}}`;
  });
}

/** 规范化粗体标记 */
export function normalizeBoldNotation(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, "{bold}$1{/bold}");
}

/** 规范化模糊标记 */
export function normalizeBlurNotation(text: string): string {
  return text.replace(/==(.+?)==/g, "{blur}$1{/blur}");
}

/** 完整规范化流程 */
export function normalizeText(text: string): string {
  let result = text;
  result = normalizeDelayNotation(result);
  result = normalizeBoldNotation(result);
  result = normalizeBlurNotation(result);
  return result;
}
