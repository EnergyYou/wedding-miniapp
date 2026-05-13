<template>
  <view class="page">
    <!-- 分类筛选 -->
    <scroll-view scroll-x class="filter-scroll">
      <view class="filter-tabs">
        <view
          v-for="cat in allCategories"
          :key="cat"
          class="filter-tab"
          :class="{ active: activeCategory === cat }"
          @tap="activeCategory = cat"
        >
          <text>{{ cat }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 统计摘要 -->
    <view class="stats-row">
      <view class="stat-card">
        <text class="stat-num" style="color: #FF9800">{{ vendors.filter(v => v.status === 0).length }}</text>
        <text class="stat-label">备选</text>
      </view>
      <view class="stat-card">
        <text class="stat-num" style="color: #4CAF50">{{ vendors.filter(v => v.status === 1).length }}</text>
        <text class="stat-label">已签约</text>
      </view>
      <view class="stat-card">
        <text class="stat-num" style="color: #999">{{ vendors.filter(v => v.status === 2).length }}</text>
        <text class="stat-label">已排除</text>
      </view>
    </view>

    <!-- 供应商列表 -->
    <view v-for="cat in displayCategories" :key="cat" class="vendor-category">
      <text class="cat-title">{{ cat }}</text>

      <view
        v-for="v in getVendorsByCat(cat)"
        :key="v.id"
        class="vendor-card"
        :class="{ excluded: v.status === 2 }"
      >
        <view class="card-header">
          <view class="card-title-row">
            <text class="vendor-name" :class="{ 'name-excluded': v.status === 2 }">{{ v.name }}</text>
            <view class="status-badge" :class="'status-' + v.status">
              <text class="status-text">{{ statusLabel(v.status) }}</text>
            </view>
          </view>
          <view class="rating-row">
            <text class="stars">{{ renderStars(v.score ?? 0) }}</text>
            <text class="price">{{ v.priceQuote || '暂无报价' }}</text>
          </view>
        </view>

        <view class="card-body">
          <view class="info-row">
            <text class="info-label">联系人</text>
            <text class="info-value">{{ v.contact || '未填写' }}</text>
          </view>
          <text v-if="v.remark" class="remark">{{ v.remark }}</text>
        </view>
      </view>
    </view>

    <!-- FAB -->
    <view class="fab" @tap="handleAdd">
      <text class="fab-text">+</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getVendorList, getVendorCategories } from '../../api/vendor'
import type { Vendor } from '../../api/vendor'

const activeCategory = ref('全部')
const vendors = ref<Vendor[]>([])
const categories = ref<string[]>([])

const allCategories = computed(() => {
  return ['全部', ...categories.value]
})

const displayCategories = computed(() => {
  if (activeCategory.value === '全部') {
    return categories.value
  }
  return [activeCategory.value]
})

function getVendorsByCat(cat: string): Vendor[] {
  return vendors.value.filter(v => v.category === cat)
}

function renderStars(score: number): string {
  return '★'.repeat(score) + '☆'.repeat(5 - score)
}

function statusLabel(status: number): string {
  return status === 1 ? '已签约' : status === 2 ? '已排除' : '备选'
}

function handleAdd() {
  uni.showToast({ title: '添加供应商功能开发中', icon: 'none' })
}

async function fetchCategories() {
  try {
    const result = await getVendorCategories()
    categories.value = result ?? []
  } catch {
    uni.showToast({ title: '获取分类失败', icon: 'none' })
    categories.value = []
  }
}

async function fetchVendors() {
  try {
    const result = await getVendorList()
    vendors.value = result ?? []
  } catch {
    uni.showToast({ title: '获取供应商列表失败', icon: 'none' })
    vendors.value = []
  }
}

onMounted(async () => {
  await Promise.all([fetchCategories(), fetchVendors()])
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: $wedding-bg;
  padding-bottom: 120rpx;
}

.filter-scroll {
  white-space: nowrap;
  padding: 24rpx 32rpx;
}

.filter-tabs {
  display: inline-flex;
  gap: 16rpx;
}

.filter-tab {
  padding: 12rpx 28rpx;
  border-radius: 40rpx;
  font-size: 26rpx;
  background: #ffffff;
  color: #666;
  border: 1rpx solid #eee;
  flex-shrink: 0;
}

.filter-tab.active {
  background: $wedding-primary;
  color: #ffffff;
  border-color: $wedding-primary;
}

.stats-row {
  display: flex;
  padding: 0 32rpx 24rpx;
  gap: 16rpx;
}

.stat-card {
  flex: 1;
  text-align: center;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 20rpx 0;
}

.stat-num {
  font-size: 36rpx;
  font-weight: 700;
  display: block;
}

.stat-label {
  font-size: 22rpx;
  color: #999;
  display: block;
  margin-top: 4rpx;
}

.vendor-category {
  padding: 0 32rpx 16rpx;
}

.cat-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #666;
  margin-bottom: 16rpx;
  display: block;
}

.vendor-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.vendor-card.excluded {
  opacity: 0.6;
}

.card-header {
  margin-bottom: 20rpx;
}

.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.vendor-name {
  font-size: 32rpx;
  font-weight: 600;
}

.name-excluded {
  text-decoration: line-through;
  color: #999;
}

.status-badge {
  padding: 6rpx 20rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
}

.status-0 { background: #FFF3E0; }
.status-0 .status-text { color: #F57C00; }
.status-1 { background: #E8F5E9; }
.status-1 .status-text { color: #4CAF50; }
.status-2 { background: #F5F5F5; }
.status-2 .status-text { color: #999; }

.rating-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12rpx;
}

.stars {
  font-size: 28rpx;
  color: #FFB300;
  letter-spacing: 2rpx;
}

.price {
  font-size: 28rpx;
  font-weight: 600;
  color: $wedding-accent;
}

.card-body {
  border-top: 1rpx solid #F5F5F5;
  padding-top: 20rpx;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.info-label {
  font-size: 24rpx;
  color: #999;
  margin-right: 16rpx;
}

.info-value {
  font-size: 24rpx;
  color: $wedding-text;
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-bottom: 12rpx;
}

.tag {
  font-size: 22rpx;
  background: #F5F5F5;
  color: #666;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
}

.remark {
  font-size: 24rpx;
  color: #999;
  line-height: 1.5;
  display: block;
}

.fab {
  position: fixed;
  bottom: 140rpx;
  right: 40rpx;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, $wedding-primary, $wedding-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(232, 160, 191, 0.4);
  z-index: 100;
}

.fab:active {
  transform: scale(0.95);
}

.fab-text {
  font-size: 48rpx;
  color: #ffffff;
  font-weight: 300;
}
</style>
