<template>
  <div class="command-line">
    <span class="command-debug">
      [CMD: {{ line.command }}] {{ commandDescription }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import type { CommandLine } from "@/types";

const props = defineProps<{
  line: CommandLine;
  index: number;
}>();

const emit = defineEmits<{
  "command-execute": [command: CommandLine, lineIndex: number];
}>();

onMounted(() => {
  emit("command-execute", props.line, props.index);
});

const commandDescription = computed(() => {
  const { command, params } = props.line;
  switch (command) {
    case "setFlag":
      return `设置 flag: ${params.flag || "N/A"}`;
    case "unsetFlag":
      return `取消 flag: ${params.flag || "N/A"}`;
    case "jump":
      return `跳转到: ${params.segmentId || "N/A"}`;
    case "end":
      return "结束游戏";
    case "return":
      return "返回上一层";
    default:
      return `未知命令: ${command}`;
  }
});
</script>

<style scoped>
.command-line {
  margin: 8px 0;
}

.command-debug {
  font-size: 11px;
  color: #888;
  font-style: italic;
  font-family: "Courier New", monospace;
  opacity: 0.7;
}
</style>
