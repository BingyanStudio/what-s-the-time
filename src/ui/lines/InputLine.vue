<template>
  <div class="input-line">
    <TimeInput
      :disabled="line.status === 'completed' || line.status === 'disabled'"
      :auto-focus="index === currentLineIndex"
      @complete="(time: string) => $emit('input-complete', time, index)"
    />
  </div>
</template>

<script setup lang="ts">
import type { DisplayedLine } from "@/types";
import TimeInput from "@/ui/input/TimeInput.vue";

defineProps<{
  line: DisplayedLine;
  index: number;
  currentLineIndex: number;
}>();

defineEmits<{
  "input-complete": [time: string, lineIndex: number];
}>();
</script>

<style scoped>
.input-line {
  margin: 16px 0;
}
</style>
