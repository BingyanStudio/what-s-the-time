<template>
  <div class="choices">
    <button
      v-for="(choice, choiceIndex) in line.choices"
      :key="choiceIndex"
      :disabled="isDisabled"
      :class="{
        'choice-button': true,
        'choice-button-disabled': isDisabled,
        'choice-button-selected': isSelected(choiceIndex),
        'choice-button-unselected': isDisabled && !isSelected(choiceIndex),
      }"
      @click.stop="handleChoiceClick(choice, choiceIndex)"
    >
      {{ choice.text }}
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { ChoiceLine, DisplayedLine } from "@/types";

const props = defineProps<{
  line: DisplayedLine & ChoiceLine;
  index: number;
}>();

const emit = defineEmits<{
  "choice-select": [
    choice: ChoiceLine["choices"][0],
    lineIndex: number,
    choiceIndex: number,
  ];
}>();

const isDisabled = computed(() => {
  return props.line.status === "completed" || props.line.status === "disabled";
});

const isSelected = (choiceIndex: number): boolean => {
  return isDisabled.value && props.line.selectedChoiceIndex === choiceIndex;
};

const handleChoiceClick = (
  choice: ChoiceLine["choices"][0],
  choiceIndex: number,
) => {
  if (!isDisabled.value) {
    emit("choice-select", choice, props.index, choiceIndex);
  }
};
</script>

<style scoped>
.choices {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.choice-button {
  padding: 10px 16px;
  background: transparent;
  border: 1px solid #666;
  color: #666;
  font-size: 16px;
  cursor: pointer;
  border-radius: 0;
  transition: all 0.2s;
  text-align: left;
  font-family: inherit;
}

.choice-button:hover {
  color: #999;
  border-color: #999;
  background: rgba(255, 255, 255, 0.05);
}

.choice-button-selected {
  color: #fff !important;
  border-color: #fff !important;
  background: transparent;
}

.choice-button-selected:hover {
  color: #fff !important;
  border-color: #fff !important;
  background: transparent;
}

.choice-button-unselected {
  color: #444 !important;
  border-color: #333 !important;
  opacity: 0.6;
}

.choice-button-unselected:hover {
  color: #444 !important;
  border-color: #333 !important;
  background: transparent;
}

.choice-button:disabled,
.choice-button-disabled {
  cursor: not-allowed;
  pointer-events: none;
}
</style>
