<template>
  <div class="time-display-wrapper">
    <span
      v-for="(char, index) in timeChars"
      :key="index"
      class="time-display-char"
      :class="{ 'separator': index === TIME_INPUT_SEPARATOR_INDEX }"
    >{{ char }}</span>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { TIME_INPUT_SEPARATOR_INDEX } from "@/constants";

const props = defineProps<{
  time: string;
}>();

/**
 * 将时间字符串转换为字符数组用于显示
 * 例如: "20:42" -> ["2", "0", ":", "4", "2"]
 */
const timeChars = computed(() => {
  const time = props.time || "";
  const chars: string[] = [];

  if (time.length >= 5) {
    // HH:MM 格式
    chars[0] = time[0] || "";
    chars[1] = time[1] || "";
    chars[2] = ":"; // 分隔符
    chars[3] = time[3] || "";
    chars[4] = time[4] || "";
  } else {
    // 如果格式不正确，填充空字符
    chars[0] = "";
    chars[1] = "";
    chars[2] = ":";
    chars[3] = "";
    chars[4] = "";
  }

  return chars;
});
</script>

<style scoped>
.time-display-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
}

.time-display-char {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: rgba(26, 26, 26, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  font-size: 24px;
  font-weight: 500;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  border-radius: 4px;
  transition: all 0.2s;
}

.time-display-char.separator {
  width: 20px;
  border: none;
  background: transparent;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  font-size: 24px;
  font-weight: 500;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: rgba(255, 255, 255, 0.5);
}
</style>

