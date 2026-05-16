<template>
  <view class="page">
    <!-- 页面头部 -->
    <view class="page-header">
      <view class="header-content">
        <text class="title">更多功能</text>
        <text class="subtitle">备婚好帮手，一应俱全</text>
      </view>
    </view>

    <!-- 2x4 网格布局 -->
    <view class="tool-grid">
      <view class="tool-card" @tap="navigateTo('/pages/items/index')">
        <view class="tool-icon-wrap" style="background: #FFF0F5">
          <text class="tool-emoji">{{ '📦' }}</text>
        </view>
        <text class="tool-name">物品清单</text>
      </view>

      <view class="tool-card" @tap="navigateTo('/pages/vendors/index')">
        <view class="tool-icon-wrap" style="background: #E8F5E9">
          <text class="tool-emoji">{{ '🏠' }}</text>
        </view>
        <text class="tool-name">供应商</text>
      </view>

      <view class="tool-card" @tap="navigateTo('/pages/speeches/index')">
        <view class="tool-icon-wrap" style="background: #E3F2FD">
          <text class="tool-emoji">{{ '📝' }}</text>
        </view>
        <text class="tool-name">婚礼话术</text>
      </view>

      <view class="tool-card" @tap="navigateTo('/pages/timeline/index')">
        <view class="tool-icon-wrap" style="background: #FFF8E1">
          <text class="tool-emoji">{{ '📅' }}</text>
        </view>
        <text class="tool-name">备婚时间线</text>
      </view>

      <view class="tool-card" @tap="navigateTo('/pages/collaboration/index')">
        <view class="tool-icon-wrap" style="background: #FCE4EC">
          <text class="tool-emoji">{{ '💑' }}</text>
        </view>
        <text class="tool-name">双人协作</text>
      </view>

      <view class="tool-card" @tap="navigateTo('/pages/reminder/index')">
        <view class="tool-icon-wrap" style="background: #FFF3E0">
          <text class="tool-emoji">{{ '🔔' }}</text>
        </view>
        <text class="tool-name">提醒设置</text>
      </view>

      <view class="tool-card" @tap="navigateTo('/pages/guide/index')">
        <view class="tool-icon-wrap" style="background: #E8EAF6">
          <text class="tool-emoji">{{ '📖' }}</text>
        </view>
        <text class="tool-name">备婚攻略</text>
      </view>

      <view class="tool-card" @tap="navigateTo('/pages/tasklist/index')">
        <view class="tool-icon-wrap" style="background: #F3E5F5">
          <text class="tool-emoji">{{ '✅' }}</text>
        </view>
        <text class="tool-name">全部任务</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
function navigateTo(url: string) {
  uni.navigateTo({ url })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: $wedding-bg;
}

.page-header {
  background: linear-gradient(135deg, #E8A0BF 0%, #D4A574 100%);
  padding: 80rpx 40rpx 40rpx;
  border-radius: 0 0 48rpx 48rpx;
}

.header-content {
  color: #ffffff;
}

.title {
  font-size: 40rpx;
  font-weight: 700;
  color: #ffffff;
  display: block;
}

.subtitle {
  font-size: 26rpx;
  opacity: 0.85;
  margin-top: 8rpx;
  color: #ffffff;
  display: block;
}

.tool-grid {
  padding: 32rpx;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.tool-card {
  width: 48%;
  margin-bottom: 24rpx;
  background: #ffffff;
  border-radius: 32rpx;
  padding: 36rpx 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(232, 160, 191, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
}

.tool-icon-wrap {
  width: 96rpx;
  height: 96rpx;
  border-radius: 24rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
}

.tool-emoji {
  font-size: 44rpx;
}

.tool-name {
  font-size: 28rpx;
  font-weight: 600;
  color: $wedding-text;
}
</style>
