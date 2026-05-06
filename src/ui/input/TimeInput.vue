<template>
  <div class="time-input-wrapper">
    <input
      v-for="(_, index) in chars"
      :key="index"
      :ref="(el) => setRef(el, index)"
      v-model="chars[index]"
      @input="(e) => handleInput(e, index)"
      @keydown="(e) => handleKeydown(e, index)"
      @paste="handlePaste"
      type="text"
      maxlength="1"
      class="time-input-char"
      :class="{ 'separator': index === TIME_INPUT_SEPARATOR_INDEX }"
      :disabled="disabled || isProcessing || index === TIME_INPUT_SEPARATOR_INDEX"
      :readonly="index === TIME_INPUT_SEPARATOR_INDEX"
    />
  </div>
</template>

<script setup lang="ts">
import { nextTick, onMounted } from "vue";
import { useTimeInput } from "@/composables/useTimeInput";
import { INPUT_FOCUS_DELAY, TIME_INPUT_SEPARATOR_INDEX } from "@/constants";

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    autoFocus?: boolean;
  }>(),
  {
    disabled: false,
    autoFocus: true,
  },
);

const emit = defineEmits<{
  complete: [time: string];
}>();

const {
  chars,
  isProcessing,
  handleInput,
  handleKeydown,
  handlePaste,
  setRef,
  focus,
} = useTimeInput({
  onComplete: (time) => emit("complete", time),
  disabled: () => props.disabled,
});

// 自动聚焦
onMounted(() => {
  if (props.autoFocus) {
    nextTick(() => {
      setTimeout(() => {
        focus(0);
      }, INPUT_FOCUS_DELAY);
    });
  }
});
</script>

<style scoped>
.time-input-wrapper {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
}

.time-input-char {
  width: 50px;
  height: 50px;
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
  outline: none;
  transition: all 0.2s;
}

.time-input-char:focus {
  border-color: rgba(255, 255, 255, 0.5);
  background: rgba(26, 26, 26, 0.8);
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.1);
}

.time-input-char.separator {
  width: 20px;
  border: none;
  background: transparent;
  pointer-events: none;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  font-size: 24px;
  font-weight: 500;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: rgba(255, 255, 255, 0.5);
}

.time-input-char.separator:focus {
  box-shadow: none;
}
</style>

