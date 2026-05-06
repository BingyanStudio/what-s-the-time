<template>
  <div class="time-choice">
    <TimeInput
      :auto-focus="shouldAutoFocus"
      :disabled="isDisabled"
      @complete="(time: string) => $emit('time-choice-complete', time, index)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { DisplayedLine, TimeChoiceLine } from "@/types";
import TimeInput from "@/ui/input/TimeInput.vue";

const props = defineProps<{
  line: DisplayedLine & TimeChoiceLine;
  index: number;
  currentLineIndex: number;
}>();

defineEmits<{
  "time-choice-complete": [time: string, lineIndex: number];
}>();

const shouldAutoFocus = computed(() => props.index === props.currentLineIndex);

const isDisabled = computed(() => {
  return props.line.status === "completed" || props.line.status === "disabled";
});
</script>

<style scoped>
.time-choice {
  margin-top: 24px;
  margin-bottom: 20px;
}
</style>
