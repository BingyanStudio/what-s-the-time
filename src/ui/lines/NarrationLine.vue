<template>
  <div class="narration">
    <TypingText
      v-if="index === currentLineIndex"
      :nodes="line.nodes"
      :ref="(el: any) => $emit('set-typing-ref', el, index)"
      :auto-start="false"
      @complete="$emit('line-complete')"
    />
    <FormattedText
      v-else-if="index < currentLineIndex"
      :nodes="line.nodes"
    />
  </div>
</template>

<script setup lang="ts">
import type { NarrationLine } from "@/types";
import FormattedText from "@/ui/shared/FormattedText.vue";
import TypingText from "@/ui/shared/TypingText.vue";

defineProps<{
  line: NarrationLine;
  index: number;
  currentLineIndex: number;
}>();

defineEmits<{
  "set-typing-ref": [el: unknown, index: number];
  "line-complete": [];
}>();
</script>

<style scoped>
.narration {
  margin: 16px 0;
  color: #ccc;
}
</style>
