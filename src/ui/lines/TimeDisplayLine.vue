<template>
  <div class="time-display-line">
    <TimeDisplay :time="line.value" />
  </div>
</template>

<script setup lang="ts">
import type { TimeDisplayLine } from "@/types";
import TimeDisplay from "@/ui/display/TimeDisplay.vue";

defineProps<{
  line: TimeDisplayLine;
  index: number;
}>();
</script>

<style scoped>
.time-display-line {
  margin-top: 24px;
  margin-bottom: 20px;
}
</style>
