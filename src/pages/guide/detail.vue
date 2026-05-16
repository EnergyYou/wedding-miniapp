<template>
  <view class="detail-page">
    <view v-if="guide" class="detail-content">
      <view class="detail-header">
        <text class="detail-category">{{ guide.category }}</text>
        <text class="detail-title">{{ guide.title }}</text>
      </view>
      <view class="detail-body">
        <rich-text :nodes="guide.content" />
      </view>
    </view>
    <view v-else class="empty-state">
      <text class="empty-text">加载中...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getGuideById, type Guide } from '@/api/guide'

const guide = ref<Guide | null>(null)

onLoad(async (query) => {
  const id = Number(query?.id)
  if (!id) return
  try {
    guide.value = await getGuideById(id)
    uni.setNavigationBarTitle({ title: guide.value.title })
  } catch {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
})
</script>

<style lang="scss" scoped>
.detail-page {
  min-height: 100vh;
  background-color: #ffffff;
}

.detail-header {
  padding: 32rpx 32rpx 24rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.detail-category {
  font-size: 22rpx;
  color: $wedding-primary;
  background: rgba($wedding-primary, 0.1);
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  display: inline-block;
  margin-bottom: 16rpx;
}

.detail-title {
  display: block;
  font-size: 36rpx;
  font-weight: 700;
  color: $wedding-text;
  line-height: 1.4;
}

.detail-body {
  padding: 24rpx 32rpx;
}

.empty-state {
  display: flex;
  justify-content: center;
  padding: 120rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: $wedding-text-light;
}
</style>
