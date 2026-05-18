<template>
  <view class="guide-page">
    <!-- Category Tabs -->
    <scroll-view scroll-x class="category-tabs" :show-scrollbar="false">
      <view
        class="tab-item"
        :class="{ active: !activeCategory }"
        @tap="switchCategory('')"
      >
        <text class="tab-text">全部</text>
      </view>
      <view
        v-for="cat in categories"
        :key="cat"
        class="tab-item"
        :class="{ active: activeCategory === cat }"
        @tap="switchCategory(cat)"
      >
        <text class="tab-text">{{ cat }}</text>
      </view>
    </scroll-view>

    <!-- Guide List -->
    <view v-if="guides.length > 0" class="guide-list">
      <view
        v-for="guide in guides"
        :key="guide.id"
        class="guide-card"
        @tap="goToDetail(guide.id)"
      >
        <view class="guide-card-body">
          <text class="guide-card-title">{{ guide.title }}</text>
          <text class="guide-card-category">{{ guide.category }}</text>
        </view>
        <text class="guide-card-arrow">&#x276F;</text>
      </view>
    </view>
    <view v-else class="empty-state">
      <text class="empty-text">暂无攻略内容</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getGuideList, getGuideCategories, type Guide } from '@/api/guide'

const categories = ref<string[]>([])
const activeCategory = ref('')
const guides = ref<Guide[]>([])

onShow(() => {
  loadCategories()
  loadGuides()
})

async function loadCategories() {
  try {
    categories.value = await getGuideCategories()
  } catch {
    // ignore
  }
}

async function loadGuides() {
  try {
    guides.value = await getGuideList(activeCategory.value || undefined)
  } catch {
    guides.value = []
  }
}

function switchCategory(cat: string) {
  activeCategory.value = cat
  loadGuides()
}

function goToDetail(id: number) {
  uni.navigateTo({ url: `/pages-sub/guide/detail?id=${id}` })
}
</script>

<style lang="scss" scoped>
.guide-page {
  min-height: 100vh;
  background-color: $wedding-bg;
  padding-bottom: 40rpx;
}

.category-tabs {
  white-space: nowrap;
  padding: 20rpx 24rpx;
  background-color: #ffffff;
}

.tab-item {
  display: inline-flex;
  padding: 12rpx 28rpx;
  margin-right: 16rpx;
  border-radius: 32rpx;
  background-color: #f5f5f5;
}

.tab-item.active {
  background: linear-gradient(135deg, $wedding-primary, $wedding-accent);
}

.tab-text {
  font-size: 26rpx;
  color: $wedding-text-light;
}

.tab-item.active .tab-text {
  color: #ffffff;
  font-weight: 600;
}

.guide-list {
  padding: 20rpx 24rpx;
}

.guide-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 28rpx 32rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.guide-card:active {
  background-color: #fafafa;
}

.guide-card-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.guide-card-title {
  font-size: 30rpx;
  color: $wedding-text;
  font-weight: 500;
  line-height: 1.5;
}

.guide-card-category {
  font-size: 22rpx;
  color: $wedding-primary;
  margin-top: 8rpx;
}

.guide-card-arrow {
  font-size: 24rpx;
  color: $wedding-text-light;
  flex-shrink: 0;
  margin-left: 16rpx;
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
