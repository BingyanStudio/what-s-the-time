<template>
  <span>
    <template v-for="(node, index) in nodes" :key="index">
      <br v-if="node.type === 'linebreak'" />
      <template v-else-if="node.type === 'delay'">
        <!-- delay节点不渲染任何内容 -->
      </template>
      <span
        v-else-if="node.type === 'systemTime'"
        :class="{
          'text-red': false,
          'text-bold': false,
          'text-italic': false
        }"
      >
        {{ systemTimeDisplay }}
      </span>
      <span
        v-else-if="node.type === 'animateText'"
        :class="{
          'text-red': false,
          'text-bold': false,
          'text-italic': false,
          'animate-text-container': true
        }"
        :style="{ minWidth: `${getMaxLength(node, index)}ch` }"
      >
        {{ getAnimateText(node, index) }}<span
          v-if="shouldShowCursor(node, index)"
          class="typing-cursor"
        >▮</span>
      </span>
      <span
        v-else
        :class="{
          'text-red': node.formats?.includes('red') || node.type === 'red',
          'text-bold': node.formats?.includes('bold') || node.type === 'bold',
          'text-italic': node.formats?.includes('italic') || node.type === 'italic',
          'text-blur': node.formats?.includes('blur') || node.type === 'blur',
          'text-strike': node.formats?.includes('strike') || node.type === 'strike'
        }"
      >
        {{ node.content }}
      </span>
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed, watch } from "vue";
import { useAnimateText } from "@/composables/useAnimateText";
import { useSystemTime } from "@/composables/useSystemTime";
import type { TextNode } from "@/types";

const props = defineProps<{
  nodes: TextNode[];
}>();

// ✅ 直接使用，无需解析
const parsedNodes = computed(() => props.nodes);

// 使用全局系统时间
const { systemTime, getCurrentSystemTime } = useSystemTime();

// 确保始终有值
const systemTimeDisplay = computed(() => {
  return systemTime.value || getCurrentSystemTime();
});

// 使用动画文本管理
const {
  getAnimateText,
  getMaxLength,
  shouldShowCursor,
  startAnimation,
  cleanup,
} = useAnimateText();

// 初始化动画文本的函数
const initializeAnimateTexts = () => {
  cleanup();

  // 为新的 animateText 节点启动定时器
  parsedNodes.value.forEach((node, index) => {
    if (node.type === "animateText") {
      startAnimation(node, index);
    }
  });
};

// 监听 nodes 的变化，重新初始化动画
watch(
  parsedNodes,
  () => {
    initializeAnimateTexts();
  },
  { immediate: true },
);
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
