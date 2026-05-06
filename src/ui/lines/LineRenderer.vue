<template>
  <NarrationLine
    v-if="line.type === 'narration'"
    :line="line"
    :index="index"
    :current-line-index="currentLineIndex"
    @set-typing-ref="(el: unknown, idx: number) => $emit('set-typing-ref', el, idx)"
    @line-complete="$emit('line-complete')"
  />
  <DialogueLine
    v-else-if="line.type === 'dialogue'"
    :line="line"
    :index="index"
    :current-line-index="currentLineIndex"
    @set-typing-ref="(el: unknown, idx: number) => $emit('set-typing-ref', el, idx)"
    @line-complete="$emit('line-complete')"
  />
  <ChoiceLine
    v-else-if="line.type === 'choice'"
    :line="line"
    :index="index"
    @choice-select="
      (choice: ChoiceOption, lineIndex: number, choiceIndex: number) =>
        $emit('choice-select', choice, lineIndex, choiceIndex)
    "
  />
  <TimeChoiceLine
    v-else-if="line.type === 'timeChoice'"
    :line="line"
    :index="index"
    :current-line-index="currentLineIndex"
    @time-choice-complete="(time: string, idx: number) => $emit('time-choice-complete', time, idx)"
  />
  <InputLine
    v-else-if="line.type === 'input'"
    :line="line"
    :index="index"
    :current-line-index="currentLineIndex"
    @input-complete="(time: string, idx: number) => $emit('input-complete', time, idx)"
  />
  <TimeDisplayLine
    v-else-if="line.type === 'timeDisplay'"
    :line="line"
    :index="index"
  />
  <CommandLine
    v-else-if="line.type === 'command'"
    :line="line"
    :index="index"
    @command-execute="
      (cmd: CommandLineType, idx: number) => $emit('command-execute', cmd, idx)
    "
  />
</template>

<script setup lang="ts">
import type {
  ChoiceLine as ChoiceLineType,
  CommandLine as CommandLineType,
  DisplayedLine,
} from "@/types";
import ChoiceLine from "./ChoiceLine.vue";
import CommandLine from "./CommandLine.vue";
import DialogueLine from "./DialogueLine.vue";
import InputLine from "./InputLine.vue";
import NarrationLine from "./NarrationLine.vue";
import TimeChoiceLine from "./TimeChoiceLine.vue";
import TimeDisplayLine from "./TimeDisplayLine.vue";

type ChoiceOption = ChoiceLineType["choices"][0];

defineProps<{
  line: DisplayedLine;
  index: number;
  currentLineIndex: number;
}>();

defineEmits<{
  "set-typing-ref": [el: unknown, index: number];
  "line-complete": [];
  "choice-select": [choice: ChoiceOption, lineIndex: number, choiceIndex: number];
  "time-choice-complete": [time: string, lineIndex: number];
  "input-complete": [time: string, lineIndex: number];
  "command-execute": [command: CommandLineType, lineIndex: number];
}>();
</script>
