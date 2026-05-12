<template>
  <view class="page">
    <!-- 页面头部 -->
    <view class="page-header">
      <view class="header-content">
        <text class="title">更多功能</text>
        <text class="subtitle">备婚好帮手，一应俱全</text>
      </view>
    </view>

    <!-- 功能入口网格 -->
    <view class="feature-grid">
      <view class="feature-card" @tap="navigateTo('/pages/items/index')">
        <view class="icon" style="background: #FFF0F5; color: #E8A0BF">
          <text class="icon-text">&#x1F4E6;</text>
        </view>
        <text class="name">物品清单</text>
        <text class="desc">采购物品跟踪管理</text>
      </view>
      <view class="feature-card" @tap="navigateTo('/pages/vendors/index')">
        <view class="icon" style="background: #E8F5E9; color: #4CAF50">
          <text class="icon-text">&#x1F3E0;</text>
        </view>
        <text class="name">供应商管理</text>
        <text class="desc">对比选择最优方案</text>
      </view>
      <view class="feature-card" @tap="navigateTo('/pages/speeches/index')">
        <view class="icon" style="background: #E3F2FD; color: #1976D2">
          <text class="icon-text">&#x1F4DD;</text>
        </view>
        <text class="name">婚礼话术</text>
        <text class="desc">致辞模板一键复制</text>
      </view>
      <view class="feature-card" @tap="navigateTo('/pages/timeline/index')">
        <view class="icon" style="background: #FFF8E1; color: #F57C00">
          <text class="icon-text">&#x1F4C5;</text>
        </view>
        <text class="name">备婚时间线</text>
        <text class="desc">全流程任务追踪</text>
      </view>
    </view>

    <!-- 实用工具 -->
    <view class="tools-section">
      <text class="section-title">实用工具</text>
      <view class="tool-list">
        <view class="tool-item" @tap="handleToolTap('collaboration')">
          <view class="tool-icon" style="background: #FCE4EC; color: #E91E63">
            <text class="tool-icon-text">&#x1F496;</text>
          </view>
          <view class="tool-info">
            <text class="tool-name">双人协作</text>
            <text class="tool-desc">与另一半共同管理备婚</text>
          </view>
          <text class="arrow">></text>
        </view>
        <view class="tool-item" @tap="handleToolTap('budget')">
          <view class="tool-icon" style="background: #E8F5E9; color: #4CAF50">
            <text class="tool-icon-text">&#x1F4CA;</text>
          </view>
          <view class="tool-info">
            <text class="tool-name">婚礼预算</text>
            <text class="tool-desc">支出记录与预算管控</text>
          </view>
          <text class="arrow">></text>
        </view>
        <view class="tool-item" @tap="handleToolTap('reminders')">
          <view class="tool-icon" style="background: #FFF3E0; color: #F57C00">
            <text class="tool-icon-text">&#x1F514;</text>
          </view>
          <view class="tool-info">
            <text class="tool-name">提醒设置</text>
            <text class="tool-desc">任务截止日期提醒</text>
          </view>
          <text class="arrow">></text>
        </view>
        <view class="tool-item" @tap="handleToolTap('guide')">
          <view class="tool-icon" style="background: #E3F2FD; color: #1976D2">
            <text class="tool-icon-text">&#x1F4DA;</text>
          </view>
          <view class="tool-info">
            <text class="tool-name">备婚攻略</text>
            <text class="tool-desc">经验分享与注意事项</text>
          </view>
          <text class="arrow">></text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
function navigateTo(url: string) {
  uni.navigateTo({ url })
}

function handleToolTap(tool: string) {
  uni.showToast({ title: '功能开发中', icon: 'none' })
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

.feature-grid {
  padding: 32rpx;
  display: flex;
  flex-wrap: wrap;
  gap: 24rpx;
}

.feature-card {
  width: calc(50% - 12rpx);
  background: #ffffff;
  border-radius: 32rpx;
  padding: 40rpx 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(232, 160, 191, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.feature-card:active {
  opacity: 0.9;
}

.icon {
  width: 112rpx;
  height: 112rpx;
  border-radius: 32rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24rpx;
}

.icon-text {
  font-size: 56rpx;
}

.name {
  font-size: 30rpx;
  font-weight: 600;
  color: $wedding-text;
  margin-bottom: 8rpx;
}

.desc {
  font-size: 24rpx;
  color: #999;
}

.tools-section {
  padding: 0 32rpx 32rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 24rpx;
  display: block;
}

.tool-list {
  background: #ffffff;
  border-radius: 32rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 16rpx rgba(232, 160, 191, 0.1);
}

.tool-item {
  display: flex;
  align-items: center;
  padding: 28rpx 32rpx;
  border-bottom: 1rpx solid #F5F5F5;
}

.tool-item:last-child {
  border-bottom: none;
}

.tool-item:active {
  background-color: #FAFAFA;
}

.tool-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 24rpx;
  flex-shrink: 0;
}

.tool-icon-text {
  font-size: 36rpx;
}

.tool-info {
  flex: 1;
}

.tool-name {
  font-size: 28rpx;
  font-weight: 500;
  display: block;
}

.tool-desc {
  font-size: 24rpx;
  color: #999;
  margin-top: 4rpx;
  display: block;
}

.arrow {
  color: #ccc;
  font-size: 28rpx;
}
</style>
