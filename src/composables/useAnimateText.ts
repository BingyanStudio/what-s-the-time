import { onUnmounted, ref } from "vue";
import type { TextNode } from "@/types";

/**
 * 动画文本切换间隔（毫秒）
 */
const ANIMATE_INTERVAL = 300;

/**
 * 每个字符的删除/打字间隔（毫秒）
 */
const CHAR_INTERVAL = 100;

/**
 * 动画状态
 */
type AnimationState = "idle" | "deleting" | "typing";

/**
 * 节点动画状态
 */
interface NodeAnimationState {
  currentIndex: number;
  displayLength: number;
  state: AnimationState;
}

/**
 * 动画文本管理 Composable
 * 用于管理 animateText 节点的文本切换动画
 */
export function useAnimateText() {
  // 每个节点的动画索引（用于普通显示模式）
  const animateTextIndices = ref<Map<number, number>>(new Map());
  // 每个节点的定时器
  const animateTextIntervals = ref<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  // 每个节点在打字时使用的文本索引（打字完成后会继续切换）
  const animateTextTypingIndices = ref<Map<number, number>>(new Map());
  // 每个节点的动画状态（用于删除-打字动画）
  const animateTextStates = ref<Map<number, NodeAnimationState>>(new Map());
  // 每个节点的最长文本长度（用于固定宽度）
  const animateTextMaxLengths = ref<Map<number, number>>(new Map());

  /**
   * 计算文本的实际宽度（考虑中英文字符宽度差异）
   * 中文字符占 2 个字符宽度，英文字符占 1 个字符宽度
   */
  const calculateTextWidth = (text: string): number => {
    let width = 0;
    // 使用 for...of 遍历字符串，正确处理 Unicode 代理对
    for (const char of text) {
      // 使用 codePointAt 获取完整的 Unicode 码点（支持扩展字符）
      const code = char.codePointAt(0) ?? char.charCodeAt(0);

      // 判断是否为中文字符（包括中文标点）
      // Unicode 范围：CJK统一汉字、CJK扩展A、CJK扩展B等，以及中文标点符号
      if (
        (code >= 0x4e00 && code <= 0x9fff) || // CJK统一汉字
        (code >= 0x3400 && code <= 0x4dbf) || // CJK扩展A
        (code >= 0x20000 && code <= 0x2a6df) || // CJK扩展B
        (code >= 0x2a700 && code <= 0x2b73f) || // CJK扩展C
        (code >= 0x2b740 && code <= 0x2b81f) || // CJK扩展D
        (code >= 0xf900 && code <= 0xfaff) || // CJK兼容汉字
        (code >= 0x2f800 && code <= 0x2fa1f) || // CJK兼容扩展
        (code >= 0x3000 && code <= 0x303f) || // CJK符号和标点
        (code >= 0xff00 && code <= 0xffef) // 全角字符
      ) {
        width += 1;
      } else {
        width += 0.5;
      }
    }

    // add 1 for cursor,add 1 for space
    return width + 2;
  };

  /**
   * 计算并缓存节点的最长文本长度
   */
  const calculateMaxLength = (node: TextNode, nodeIndex: number): number => {
    if (
      node.type !== "animateText" ||
      !node.animateTexts ||
      node.animateTexts.length === 0
    ) {
      return 0;
    }

    // 如果已经缓存，直接返回
    if (animateTextMaxLengths.value.has(nodeIndex)) {
      return animateTextMaxLengths.value.get(nodeIndex) as number;
    }

    // 计算最长文本的实际宽度（包括光标和间距）
    // 光标占 1 个字符宽度，间距占 2 个字符宽度
    const maxWidth =
      Math.max(...node.animateTexts.map((text) => calculateTextWidth(text))) +
      3;
    animateTextMaxLengths.value.set(nodeIndex, maxWidth);
    return maxWidth;
  };

  /**
   * 获取指定节点的当前显示文本（普通模式）
   */
  const getAnimateText = (node: TextNode, nodeIndex: number): string => {
    if (
      node.type !== "animateText" ||
      !node.animateTexts ||
      node.animateTexts.length === 0
    ) {
      return node.content;
    }

    const state = animateTextStates.value.get(nodeIndex);
    if (!state) {
      return node.animateTexts[0] || node.content;
    }

    const currentText =
      node.animateTexts[state.currentIndex] || node.animateTexts[0];
    // 根据状态和显示长度返回部分文本
    if (state.state === "deleting" || state.state === "typing") {
      return currentText.substring(0, state.displayLength);
    }

    return currentText;
  };

  /**
   * 获取指定节点的最大文本长度（用于设置固定宽度）
   */
  const getMaxLength = (node: TextNode, nodeIndex: number): number => {
    return calculateMaxLength(node, nodeIndex);
  };

  /**
   * 获取是否显示光标（普通模式）
   */
  const shouldShowCursor = (node: TextNode, nodeIndex: number): boolean => {
    if (
      node.type !== "animateText" ||
      !node.animateTexts ||
      node.animateTexts.length === 0
    ) {
      return false;
    }

    const state = animateTextStates.value.get(nodeIndex);
    if (!state) {
      return false;
    }

    // 在删除或打字状态时显示光标
    return state.state === "deleting" || state.state === "typing";
  };

  /**
   * 获取指定节点在打字时使用的文本内容
   */
  const getAnimateTextContent = (
    node: TextNode,
    nodeIndex: number,
    isTyping: boolean,
    isCurrentNode: boolean,
  ): string => {
    if (
      node.type !== "animateText" ||
      !node.animateTexts ||
      node.animateTexts.length === 0
    ) {
      return node.content;
    }

    // 如果正在打字，使用固定的文本索引（打字时不会切换）
    if (isTyping && isCurrentNode) {
      const typingIndex = animateTextTypingIndices.value.get(nodeIndex) ?? 0;
      return node.animateTexts[typingIndex] || node.animateTexts[0];
    }

    // 打字完成后，使用动态索引
    const animateIndex = animateTextIndices.value.get(nodeIndex) ?? 0;
    return node.animateTexts[animateIndex] || node.animateTexts[0];
  };

  /**
   * 获取指定节点的显示内容（打字模式）
   */
  const getAnimateTextDisplay = (
    node: TextNode,
    nodeIndex: number,
    displayText: string,
    isTyping: boolean,
    isCurrentNode: boolean,
    isCompleted: boolean,
  ): string => {
    if (
      node.type !== "animateText" ||
      !node.animateTexts ||
      node.animateTexts.length === 0
    ) {
      return displayText;
    }

    // 如果节点还没有被打字到，不显示任何内容
    if (!isCompleted && !isCurrentNode) {
      return "";
    }

    // 如果正在打字且是当前节点，显示部分内容
    if (isTyping && isCurrentNode) {
      return displayText;
    }

    // 打字完成后，使用动画状态显示
    const state = animateTextStates.value.get(nodeIndex);
    if (state) {
      const currentText =
        node.animateTexts[state.currentIndex] || node.animateTexts[0];
      if (state.state === "deleting" || state.state === "typing") {
        return currentText.substring(0, state.displayLength);
      }
      return currentText;
    }

    // 动画尚未启动时，使用静态索引
    const animateIndex = animateTextIndices.value.get(nodeIndex) ?? 0;
    return node.animateTexts[animateIndex] || node.animateTexts[0];
  };

  /**
   * 获取是否显示光标（打字模式）
   */
  const shouldShowCursorForTyping = (
    node: TextNode,
    nodeIndex: number,
    isTyping: boolean,
    isCurrentNode: boolean,
    isCompleted: boolean,
  ): boolean => {
    if (
      node.type !== "animateText" ||
      !node.animateTexts ||
      node.animateTexts.length === 0
    ) {
      return false;
    }

    // 如果正在打字且是当前节点，显示打字光标
    if (isTyping && isCurrentNode) {
      return true;
    }

    // 如果已完成，检查动画状态
    if (isCompleted) {
      const state = animateTextStates.value.get(nodeIndex);
      if (state) {
        return state.state === "deleting" || state.state === "typing";
      }
    }

    return false;
  };

  /**
   * 启动指定节点的动画定时器（删除-打字模式）
   */
  const startAnimation = (node: TextNode, nodeIndex: number) => {
    if (
      node.type !== "animateText" ||
      !node.animateTexts ||
      node.animateTexts.length <= 1
    ) {
      return;
    }

    // 如果已经有定时器，先清除
    const existingInterval = animateTextIntervals.value.get(nodeIndex);
    if (existingInterval) {
      clearTimeout(existingInterval);
      clearInterval(existingInterval);
    }

    // 初始化状态
    let currentIndex = animateTextIndices.value.get(nodeIndex) ?? 0;
    if (currentIndex >= node.animateTexts.length) {
      currentIndex = 0;
    }

    const currentText = node.animateTexts[currentIndex];
    const initialState: NodeAnimationState = {
      currentIndex,
      displayLength: currentText.length,
      state: "idle",
    };
    animateTextStates.value.set(nodeIndex, initialState);
    animateTextIndices.value.set(nodeIndex, currentIndex);

    // 开始删除动画
    const startDeleting = () => {
      const state = animateTextStates.value.get(nodeIndex);
      if (!state) return;

      state.state = "deleting";

      const deleteChar = () => {
        const currentState = animateTextStates.value.get(nodeIndex);
        if (!currentState || currentState.state !== "deleting") return;

        if (currentState.displayLength > 0) {
          currentState.displayLength--;
          const interval = setTimeout(deleteChar, CHAR_INTERVAL);
          animateTextIntervals.value.set(
            nodeIndex,
            interval,
          );
        } else {
          // 删除完成，切换到下一个文本
          const nextIndex =
            (currentState.currentIndex + 1) %
            (node.animateTexts as string[]).length;
          currentState.currentIndex = nextIndex;
          currentState.state = "typing";
          animateTextIndices.value.set(nodeIndex, nextIndex);

          // 开始打字
          startTyping();
        }
      };

      // 等待一段时间后开始删除
      const delay = setTimeout(() => {
        deleteChar();
      }, ANIMATE_INTERVAL);
      animateTextIntervals.value.set(nodeIndex, delay);
    };

    // 开始打字动画
    const startTyping = () => {
      const state = animateTextStates.value.get(nodeIndex);
      if (!state) return;

      state.state = "typing";
      const targetText = (node.animateTexts as string[])[state.currentIndex];
      const targetLength = targetText.length;

      const typeChar = () => {
        const currentState = animateTextStates.value.get(nodeIndex);
        if (!currentState || currentState.state !== "typing") return;

        if (currentState.displayLength < targetLength) {
          currentState.displayLength++;
          const interval = setTimeout(typeChar, CHAR_INTERVAL);
          animateTextIntervals.value.set(
            nodeIndex,
            interval,
          );
        } else {
          // 打字完成，等待后开始下一轮删除
          currentState.state = "idle";
          const interval = setTimeout(() => {
            startDeleting();
          }, ANIMATE_INTERVAL);
          animateTextIntervals.value.set(
            nodeIndex,
            interval,
          );
        }
      };

      typeChar();
    };

    // 开始第一轮删除
    startDeleting();
  };

  /**
   * 停止指定节点的动画
   */
  const stopAnimation = (nodeIndex: number) => {
    const interval = animateTextIntervals.value.get(nodeIndex);
    if (interval) {
      clearTimeout(interval);
      clearInterval(interval);
      animateTextIntervals.value.delete(nodeIndex);
    }
    // 清除状态
    animateTextStates.value.delete(nodeIndex);
  };

  /**
   * 初始化打字时使用的文本索引
   */
  const initTypingIndex = (nodeIndex: number, textIndex: number = 0) => {
    if (!animateTextTypingIndices.value.has(nodeIndex)) {
      animateTextTypingIndices.value.set(nodeIndex, textIndex);
    }
  };

  /**
   * 完成打字，将打字索引同步到动画索引并启动动画
   */
  const completeTyping = (node: TextNode, nodeIndex: number) => {
    const typingIndex = animateTextTypingIndices.value.get(nodeIndex) ?? 0;
    animateTextIndices.value.set(nodeIndex, typingIndex);
    startAnimation(node, nodeIndex);
  };

  /**
   * 快速完成：设置显示文本并启动动画
   */
  const skipToComplete = (node: TextNode, nodeIndex: number) => {
    if (
      node.type !== "animateText" ||
      !node.animateTexts ||
      node.animateTexts.length === 0
    ) {
      return node.content;
    }

    // 初始化索引
    animateTextIndices.value.set(nodeIndex, 0);
    animateTextTypingIndices.value.set(nodeIndex, 0);

    // 初始化状态为完整显示第一个文本
    const firstText = node.animateTexts[0];
    const initialState: NodeAnimationState = {
      currentIndex: 0,
      displayLength: firstText.length,
      state: "idle",
    };
    animateTextStates.value.set(nodeIndex, initialState);

    // 启动动画
    startAnimation(node, nodeIndex);

    return firstText;
  };

  /**
   * 清理所有定时器和状态
   */
  const cleanup = () => {
    animateTextIntervals.value.forEach((interval) => {
      clearTimeout(interval);
      clearInterval(interval);
    });
    animateTextIntervals.value.clear();
    animateTextIndices.value.clear();
    animateTextTypingIndices.value.clear();
    animateTextStates.value.clear();
    animateTextMaxLengths.value.clear();
  };

  // 组件卸载时清理
  onUnmounted(() => {
    cleanup();
  });

  return {
    // 普通模式
    getAnimateText,
    getMaxLength,
    shouldShowCursor,
    startAnimation,
    stopAnimation,
    cleanup,

    // 打字模式
    getAnimateTextContent,
    getAnimateTextDisplay,
    shouldShowCursorForTyping,
    initTypingIndex,
    completeTyping,
    skipToComplete,

    // 状态（用于调试）
    animateTextIndices,
    animateTextTypingIndices,
    animateTextStates,
  };
}
