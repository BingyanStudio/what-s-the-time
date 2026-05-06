<template>
  <div class="watch-container">
    <img :src="watchImage" alt="Watch" class="watch-image" />
    <div class="time-display" v-if="displayTime">
      {{ displayTime }}
    </div>
  </div>
</template>

<script setup lang="ts">
import watchImage from "@/img/watch.png";

defineProps<{
  displayTime?: string;
}>();
</script>

<style scoped>
.watch-container {
  position: relative;
  width: 100%;
  height: 40%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.watch-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  pointer-events: none;
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
  user-drag: none;
}

.time-display {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 24px;
  color: #fff;
  background: rgba(0, 0, 0, 0.7);
  padding: 8px 16px;
  border-radius: 4px;
}
</style>

