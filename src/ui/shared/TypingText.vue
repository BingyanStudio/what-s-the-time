<template>
  <span>
    <template v-for="(node, index) in nodes" :key="index">
      <template v-if="node.type === 'linebreak'">
        <br />
      </template>
      <template v-else-if="node.type === 'delay'">
        <!-- delay节点不渲染任何内容 -->
      </template>
      <template v-else-if="node.type === 'systemTime'">
        <span
          :class="{
            'text-red': false,
            'text-bold': false,
            'text-italic': false
          }"
        >{{ getSystemTimeDisplay(index) }}<span
            v-if="
              isTyping &&
              index === currentIndex &&
              currentCharIndex < 5
            "
            class="typing-cursor"
          >▮</span></span>
      </template>
      <span
        v-else-if="node.type === 'animateText'"
        :class="{
          'text-red': false,
          'text-bold': false,
          'text-italic': false,
          'animate-text-container': true
        }"
        :style="{ minWidth: `${getMaxLengthForTyping(index)}ch` }"
      >{{ getAnimateTextDisplayForTyping(index) }}<span
          v-if="shouldShowCursorForTyping(index)"
          class="typing-cursor"
        >▮</span></span>
      <span
        v-else
        :class="{
          'text-red': node.formats?.includes('red') || node.type === 'red',
          'text-bold': node.formats?.includes('bold') || node.type === 'bold',
          'text-italic': node.formats?.includes('italic') || node.type === 'italic',
          'text-blur': node.formats?.includes('blur') || node.type === 'blur',
          'text-strike': (node.formats?.includes('strike') || node.type === 'strike') && isStrikeActive(index)
        }"
      >{{ displayTexts[index] || '' }}<span
          v-if="
            isTyping &&
            index === currentIndex &&
            currentCharIndex < node.content.length
          "
          class="typing-cursor"
        >▮</span></span>
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, watch } from "vue";
import { useAnimateText } from "@/composables/useAnimateText";
import { useMechanicalSound } from "@/composables/useMechanicalSound";
import { useSystemTime } from "@/composables/useSystemTime";
import type { TextNode } from "@/types";

const props = defineProps<{
  nodes: TextNode[];
  speed?: number;
  autoStart?: boolean;
}>();

const emit = defineEmits<{
  complete: [];
}>();

const parsedNodes = computed(() => props.nodes); // ✅ 直接使用，无需解析
const displayTexts = ref<string[]>([]);
const currentIndex = ref(0);
const currentCharIndex = ref(0);
const isTyping = ref(false);
const isComplete = ref(false);
const typingTimer = ref<number | null>(null);

// 使用全局系统时间
const { systemTime, getCurrentSystemTime } = useSystemTime();

// 使用机械音效
const { playRandomSound } = useMechanicalSound();

// 使用动画文本管理
const {
  getAnimateTextContent,
  getAnimateTextDisplay,
  getMaxLength,
  shouldShowCursorForTyping: shouldShowCursorForTypingBase,
  initTypingIndex,
  completeTyping,
  cleanup: cleanupAnimateText,
} = useAnimateText();

/**
 * 系统时间显示（用于打字效果）
 */
const systemTimeDisplay = computed(() => {
  const currentTime = systemTime.value || getCurrentSystemTime();

  const currentNode = parsedNodes.value[currentIndex.value];
  const isSystemTimeNode = currentNode?.type === "systemTime";

  if (isSystemTimeNode && isTyping.value) {
    const displayLength = Math.min(currentCharIndex.value, 5);
    return currentTime.substring(0, displayLength);
  }

  return currentTime;
});

/**
 * 获取指定索引的 systemTime 节点显示值
 */
const getSystemTimeDisplay = (index: number): string => {
  const currentTime = systemTime.value || getCurrentSystemTime();

  if (isTyping.value && index === currentIndex.value) {
    return systemTimeDisplay.value;
  }

  return currentTime;
};

/**
 * 获取 animateText 节点在打字时使用的文本内容
 */
const getAnimateTextContentForTyping = (index: number): string => {
  const node = parsedNodes.value[index];
  return getAnimateTextContent(
    node,
    index,
    isTyping.value,
    index === currentIndex.value,
  );
};

/**
 * 获取 animateText 节点的显示内容
 */
const getAnimateTextDisplayForTyping = (index: number): string => {
  const node = parsedNodes.value[index];
  const isCompleted = index < currentIndex.value;
  return getAnimateTextDisplay(
    node,
    index,
    displayTexts.value[index] || "",
    isTyping.value,
    index === currentIndex.value,
    isCompleted,
  );
};

/**
 * 获取是否显示光标
 */
const shouldShowCursorForTyping = (index: number): boolean => {
  const node = parsedNodes.value[index];
  const isCompleted = index < currentIndex.value;
  if (isTyping.value && index === currentIndex.value) {
    return true;
  }
  if (isCompleted) {
    return shouldShowCursorForTypingBase(
      node,
      index,
      isTyping.value,
      index === currentIndex.value,
      isCompleted,
    );
  }
  return false;
};

/**
 * 获取最大文本长度
 */
const getMaxLengthForTyping = (index: number): number => {
  const node = parsedNodes.value[index];
  return getMaxLength(node, index);
};

/**
 * 判断删除线是否应该激活
 */
const isStrikeActive = (index: number): boolean => {
  if (index < currentIndex.value) {
    return true;
  }
  if (!isTyping.value && isComplete.value) {
    return true;
  }
  return false;
};

const typingSpeed = computed(() => props.speed || 30);

// 开始显示
const startTyping = () => {
  if (isTyping.value || isComplete.value) return;

  isTyping.value = true;
  isComplete.value = false;
  displayTexts.value = [];
  currentIndex.value = 0;
  currentCharIndex.value = 0;

  // 初始化显示数组
  parsedNodes.value.forEach((node, index) => {
    if (node.type === "linebreak") {
      displayTexts.value[index] = "";
    } else {
      displayTexts.value[index] = "";
    }
  });

  typeNextChar();
};

// 显示下一个字符
const typeNextChar = () => {
  // 跳过换行和delay节点
  while (
    currentIndex.value < parsedNodes.value.length &&
    (parsedNodes.value[currentIndex.value].type === "linebreak" ||
      parsedNodes.value[currentIndex.value].type === "delay")
  ) {
    const node = parsedNodes.value[currentIndex.value];
    if (node.type === "linebreak") {
      displayTexts.value[currentIndex.value] = "";
    } else if (node.type === "delay") {
      const delayTime = (node.delayTime || 0) * 1000;
      currentIndex.value++;
      currentCharIndex.value = 0;
      typingTimer.value = window.setTimeout(() => {
        typeNextChar();
      }, delayTime);
      return;
    }
    currentIndex.value++;
    currentCharIndex.value = 0;
  }

  if (currentIndex.value >= parsedNodes.value.length) {
    isTyping.value = false;
    isComplete.value = true;
    emit("complete");
    return;
  }

  const currentNode = parsedNodes.value[currentIndex.value];

  // 处理 systemTime 节点
  if (currentNode.type === "systemTime") {
    if (currentCharIndex.value < 5) {
      playRandomSound();
      currentCharIndex.value++;
      typingTimer.value = window.setTimeout(() => {
        typeNextChar();
      }, typingSpeed.value);
    } else {
      currentIndex.value++;
      currentCharIndex.value = 0;
      typeNextChar();
    }
    return;
  }

  // 处理 animateText 节点
  if (currentNode.type === "animateText") {
    initTypingIndex(currentIndex.value, 0);

    const currentText = getAnimateTextContentForTyping(currentIndex.value);

    if (currentCharIndex.value < currentText.length) {
      const newText = currentText.substring(0, currentCharIndex.value + 1);
      displayTexts.value[currentIndex.value] = newText;
      const currentChar = currentText[currentCharIndex.value];
      currentCharIndex.value++;

      if (currentChar && !/[\s\t]/.test(currentChar)) {
        if (/[！？。，、；：]/.test(currentChar)) {
          if (Math.random() < 0.5) {
            playRandomSound();
          }
        } else {
          playRandomSound();
        }
      }

      let delay = typingSpeed.value;
      if (/[！？]/.test(currentChar)) {
        delay = typingSpeed.value * 4;
      } else if (/[。]/.test(currentChar)) {
        delay = typingSpeed.value * 3;
      } else if (/[…]/.test(currentChar)) {
        delay = typingSpeed.value * 3;
      } else if (/[，、；：]/.test(currentChar)) {
        delay = typingSpeed.value * 2;
      }

      typingTimer.value = window.setTimeout(() => {
        typeNextChar();
      }, delay);
    } else {
      completeTyping(currentNode, currentIndex.value);
      currentIndex.value++;
      currentCharIndex.value = 0;
      typeNextChar();
    }
    return;
  }

  if (currentCharIndex.value < currentNode.content.length) {
    const newText = currentNode.content.substring(
      0,
      currentCharIndex.value + 1,
    );
    displayTexts.value[currentIndex.value] = newText;
    const currentChar = currentNode.content[currentCharIndex.value];
    currentCharIndex.value++;

    if (currentChar && !/[\s\t]/.test(currentChar)) {
      if (/[！？。，、；：]/.test(currentChar)) {
        if (Math.random() < 0.5) {
          playRandomSound();
        }
      } else {
        playRandomSound();
      }
    }

    let delay = typingSpeed.value;
    if (/[！？]/.test(currentChar)) {
      delay = typingSpeed.value * 4;
    } else if (/[。]/.test(currentChar)) {
      delay = typingSpeed.value * 3;
    } else if (/[…]/.test(currentChar)) {
      delay = typingSpeed.value * 3;
    } else if (/[，、；：]/.test(currentChar)) {
      delay = typingSpeed.value * 2;
    }

    typingTimer.value = window.setTimeout(() => {
      typeNextChar();
    }, delay);
  } else {
    currentIndex.value++;
    currentCharIndex.value = 0;

    if (currentIndex.value > 0) {
      const prevNode = parsedNodes.value[currentIndex.value - 1];
      if (prevNode && prevNode.type !== "linebreak") {
        const prevLength = prevNode.content.length;
        const delay = Math.min(prevLength * 10, 500);

        typingTimer.value = window.setTimeout(() => {
          typeNextChar();
        }, delay);
      } else {
        typeNextChar();
      }
    } else {
      typeNextChar();
    }
  }
};

// 自动开始
watch(
  () => props.autoStart,
  (newValue) => {
    if (newValue) {
      startTyping();
    }
  },
  { immediate: true },
);

// 跳过
const skipToEnd = () => {
  if (typingTimer.value) {
    clearTimeout(typingTimer.value);
  }

  parsedNodes.value.forEach((node, index) => {
    if (node.type !== "linebreak" && node.type !== "delay") {
      if (node.type === "systemTime") {
        displayTexts.value[index] = "";
      } else if (node.type === "animateText") {
        const content = getAnimateTextContent(node, index, false, false);
        displayTexts.value[index] = content;
      } else {
        displayTexts.value[index] = node.content;
      }
    } else {
      displayTexts.value[index] = "";
    }
  });

  isTyping.value = false;
  isComplete.value = true;

  // 初始化所有 animateText 节点
  parsedNodes.value.forEach((node, index) => {
    if (node.type === "animateText") {
      completeTyping(node, index);
    }
  });

  emit("complete");
};

// 清理
onUnmounted(() => {
  if (typingTimer.value) {
    clearTimeout(typingTimer.value);
  }
  cleanupAnimateText();
});

// 暴露方法
defineExpose({
  startTyping,
  skipToEnd,
  isComplete,
  isTyping,
});
</script>

<style scoped>
.text-red {
  color: #ff4444 !important;
}

.text-bold {
  font-weight: 700 !important;
  font-size: 1.05em !important;
}

.text-italic {
  font-style: italic !important;
  transform: skewX(-10deg);
  display: inline-block;
  font-weight: 500;
  letter-spacing: 0.02em;
}

.text-blur {
  filter: blur(2px);
  user-select: none;
}

.text-strike {
  text-decoration-line: line-through;
  text-decoration-thickness: 0.18em;
  text-decoration-color: currentColor;
}

.animate-text-container {
  display: inline-block;
}

.typing-cursor {
  animation: blink 0.5s infinite;
  color: inherit;
}

@keyframes blink {
  0%, 50% {
    opacity: 1;
  }
  51%, 100% {
    opacity: 0.5;
  }
}
</style>
