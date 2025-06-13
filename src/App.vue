<template>
  <div class="app-container">
    <router-view></router-view>
  </div>
</template>

<script setup>
// 组件逻辑
</script>

<style>
* {
  box-sizing: border-box;
}

html,
body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
  overflow-y: hidden;
  height: 100%;
}

.app-container {
  width: 100%;
  height: 100vh;
  background-color: #f5f7fa;
  overflow: hidden;
}
</style>
