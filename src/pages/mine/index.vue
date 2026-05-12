<template>
  <view class="container">
    <text class="title">我的</text>
    <text class="subtitle">项目初始化成功</text>
  </view>
</template>

<script setup lang="ts">
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 80vh;
}
.title {
  font-size: 48rpx;
  font-weight: bold;
  color: $wedding-primary;
}
.subtitle {
  font-size: 28rpx;
  color: $wedding-text-light;
  margin-top: 20rpx;
}
</style>
