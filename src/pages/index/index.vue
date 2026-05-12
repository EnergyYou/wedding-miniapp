<template>
  <view class="container">
    <!-- 未登录状态 -->
    <view v-if="!isLoggedIn" class="login-guide">
      <text class="title">备婚清单</text>
      <text class="subtitle">正在登录...</text>
    </view>

    <!-- 已登录但未绑定情侣 -->
    <view v-else-if="!isCoupleBound" class="couple-guide">
      <text class="title">备婚清单</text>
      <text class="subtitle">邀请你的另一半，一起备婚吧</text>
      <button class="invite-btn" @tap="goToCoupleBind">邀请另一半</button>
    </view>

    <!-- 已登录且已绑定 -->
    <view v-else class="wedding-overview">
      <text class="title">备婚清单</text>
      <text class="subtitle">项目初始化成功</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useUserStore } from '@/store/user'
import { useCoupleStore } from '@/store/couple'

const userStore = useUserStore()
const coupleStore = useCoupleStore()

const isLoggedIn = computed(() => !!userStore.token)
const isCoupleBound = computed(() => coupleStore.isBound)

function goToCoupleBind() {
  uni.navigateTo({ url: '/pages/couple/bind' })
}
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
.invite-btn {
  margin-top: 40rpx;
  background-color: $wedding-primary;
  color: #ffffff;
  border-radius: 48rpx;
  font-size: 30rpx;
  padding: 16rpx 64rpx;
}
</style>
