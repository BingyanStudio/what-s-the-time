<template>
  <div class="back-to-start">
    <button @click="$emit('click')" class="back-button">
      回到开始
    </button>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  click: [];
}>();
</script>

<style scoped>
.back-to-start {
  margin-top: 32px;
  text-align: center;
}

.back-button {
  padding: 12px 32px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s;
}

.back-button:hover {
  background: rgba(255, 255, 255, 0.15);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}
</style>

