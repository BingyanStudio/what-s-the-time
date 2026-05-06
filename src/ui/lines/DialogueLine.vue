<template>
  <div class="dialogue">
    <span v-if="line.character" class="character-name">
      {{ line.character }}
    </span>
    <div class="dialogue-text" :class="{ 'with-character': !!line.character }">
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
  </div>
</template>

<script setup lang="ts">
import type { DialogueLine } from "@/types";
import FormattedText from "@/ui/shared/FormattedText.vue";
import TypingText from "@/ui/shared/TypingText.vue";

defineProps<{
  line: DialogueLine;
  index: number;
  currentLineIndex: number;
}>();

defineEmits<{
  "set-typing-ref": [el: unknown, index: number];
  "line-complete": [];
}>();
</script>

<style scoped>
.dialogue {
  margin: 16px 0;
}

.character-name {
  color: #666;
  font-size: 14px;
  display: block;
  margin-bottom: 4px;
}

.dialogue-text {
  color: #e0e0e0;
}

.dialogue-text.with-character {
  padding-left: 1.5em;
}
</style>
