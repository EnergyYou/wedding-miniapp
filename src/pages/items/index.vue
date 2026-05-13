<template>
  <view class="page">
    <!-- 筛选标签 -->
    <view class="filter-tabs">
      <view
        v-for="tab in filterTabs"
        :key="tab.key"
        class="filter-tab"
        :class="{ active: activeFilter === tab.key }"
        @tap="activeFilter = tab.key"
      >
        <text>{{ tab.label }}</text>
      </view>
    </view>

    <!-- 汇总统计 -->
    <view class="summary-row">
      <view class="summary-item">
        <text class="summary-value total">{{ items.length }}</text>
        <text class="summary-label">总物品</text>
      </view>
      <view class="summary-item">
        <text class="summary-value purchased">{{ items.filter(i => i.purchaseStatus === 2).length }}</text>
        <text class="summary-label">已采购</text>
      </view>
      <view class="summary-item">
        <text class="summary-value in-progress">{{ items.filter(i => i.purchaseStatus === 1).length }}</text>
        <text class="summary-label">采购中</text>
      </view>
      <view class="summary-item">
        <text class="summary-value pending">{{ items.filter(i => i.purchaseStatus === 0).length }}</text>
        <text class="summary-label">未采购</text>
      </view>
    </view>

    <!-- 分类区块 -->
    <view v-for="cat in categories" :key="cat.name" class="category-section">
      <view class="category-header" @tap="toggleCategory(cat.name)">
        <view class="category-left">
          <text class="category-icon">{{ cat.icon }}</text>
          <text class="category-name">{{ cat.name }}</text>
          <text class="category-count">{{ getCatProgress(cat.name) }}</text>
        </view>
        <view class="category-right">
          <view class="mini-progress">
            <view class="mini-progress-fill" :style="{ width: getCatPercent(cat.name) + '%' }"></view>
          </view>
          <text class="collapse-arrow" :class="{ expanded: !collapsedCats.has(cat.name) }">&#9662;</text>
        </view>
      </view>

      <view v-if="!collapsedCats.has(cat.name)" class="category-items">
        <view v-for="item in getCatItems(cat.name)" :key="item.id" class="item-row">
          <text class="status-icon" :class="statusClass(item.purchaseStatus)">{{ statusIcon(item.purchaseStatus) }}</text>
          <view class="item-info">
            <text class="item-name" :class="{ done: item.purchaseStatus === 2 }">{{ item.name }}</text>
            <view class="item-meta">
              <text class="item-qty">{{ item.quantity }}x ¥{{ item.price }}</text>
              <text class="assignee-badge" :class="'assignee-' + item.assignee">{{ assigneeLabel(item.assignee) }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- FAB 添加按钮 -->
    <view class="fab" @tap="handleAdd">
      <text class="fab-text">+</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { getItemList, getItemCategories } from '../../api/item'
import type { Item } from '../../api/item'

const activeFilter = ref('all')
const collapsedCats = reactive(new Set<string>())
const loading = ref(false)

const filterTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '未采购' },
  { key: 'in-progress', label: '采购中' },
  { key: 'purchased', label: '已采购' },
]

const catNameToIcon: Record<string, string> = {
  '婚房用品': '🏠',
  '伴手礼': '🎁',
  '喜糖': '🍬',
  '新人用品': '💒',
}

const items = ref<Item[]>([])
const categoryNames = ref<string[]>([])

const categories = computed(() =>
  categoryNames.value.map(name => ({
    name,
    icon: catNameToIcon[name] || '📦',
  }))
)

const filteredItems = computed(() => {
  if (activeFilter.value === 'all') return items.value
  const statusMap: Record<string, number> = {
    'pending': 0,
    'in-progress': 1,
    'purchased': 2,
  }
  const targetStatus = statusMap[activeFilter.value]
  return items.value.filter(i => i.purchaseStatus === targetStatus)
})

function toggleCategory(name: string) {
  if (collapsedCats.has(name)) {
    collapsedCats.delete(name)
  } else {
    collapsedCats.add(name)
  }
}

function getCatItems(catName: string): Item[] {
  return filteredItems.value.filter(i => i.category === catName)
}

function getCatProgress(catName: string): string {
  const catItems = getCatItems(catName)
  const done = catItems.filter(i => i.purchaseStatus === 2).length
  return `${done}/${catItems.length}`
}

function getCatPercent(catName: string): number {
  const catItems = getCatItems(catName)
  if (catItems.length === 0) return 0
  return Math.round((catItems.filter(i => i.purchaseStatus === 2).length / catItems.length) * 100)
}

function statusIcon(status: number): string {
  return status === 2 ? '✅' : status === 1 ? '⟳' : '☐'
}

function statusClass(status: number): string {
  return status === 2 ? 'status-done' : status === 1 ? 'status-progress' : 'status-pending'
}

function assigneeLabel(assignee: number): string {
  return assignee === 1 ? '郎' : assignee === 2 ? '娘' : '共'
}

function handleAdd() {
  uni.showToast({ title: '添加物品功能开发中', icon: 'none' })
}

async function fetchCategories() {
  try {
    const result = await getItemCategories()
    categoryNames.value = result ?? []
  } catch {
    categoryNames.value = []
  }
}

async function fetchItems() {
  loading.value = true
  try {
    const result = await getItemList()
    items.value = result ?? []
  } catch {
    uni.showToast({ title: '获取物品列表失败', icon: 'none' })
    items.value = []
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchCategories(), fetchItems()])
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: $wedding-bg;
  padding-bottom: 120rpx;
}

.filter-tabs {
  display: flex;
  padding: 24rpx 32rpx;
  gap: 16rpx;
}

.filter-tab {
  padding: 12rpx 32rpx;
  border-radius: 40rpx;
  font-size: 26rpx;
  background: #ffffff;
  color: #666;
  border: 1rpx solid #eee;
}

.filter-tab.active {
  background: $wedding-primary;
  color: #ffffff;
  border-color: $wedding-primary;
}

.summary-row {
  display: flex;
  padding: 0 32rpx 24rpx;
  gap: 16rpx;
}

.summary-item {
  flex: 1;
  text-align: center;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 20rpx 0;
}

.summary-value {
  font-size: 36rpx;
  font-weight: 700;
  display: block;
}

.summary-label {
  font-size: 22rpx;
  color: #999;
  display: block;
  margin-top: 4rpx;
}

.summary-value.total { color: $wedding-text; }
.summary-value.purchased { color: #4CAF50; }
.summary-value.in-progress { color: #FF9800; }
.summary-value.pending { color: #999; }

.category-section {
  margin: 0 32rpx 16rpx;
  background: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
}

.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 28rpx;
}

.category-header:active {
  background: #FAFAFA;
}

.category-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.category-icon {
  font-size: 36rpx;
}

.category-name {
  font-size: 30rpx;
  font-weight: 600;
}

.category-count {
  font-size: 24rpx;
  color: $wedding-primary;
  background: #FFF0F5;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.category-right {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.mini-progress {
  width: 100rpx;
  height: 8rpx;
  background: #F0F0F0;
  border-radius: 4rpx;
  overflow: hidden;
}

.mini-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, $wedding-primary, $wedding-accent);
  border-radius: 4rpx;
  transition: width 0.3s;
}

.collapse-arrow {
  font-size: 24rpx;
  color: #ccc;
  transition: transform 0.3s;
}

.collapse-arrow.expanded {
  transform: rotate(180deg);
}

.category-items {
  border-top: 1rpx solid #F5F5F5;
}

.item-row {
  display: flex;
  align-items: center;
  padding: 20rpx 28rpx;
  border-bottom: 1rpx solid #FAFAFA;
}

.item-row:last-child {
  border-bottom: none;
}

.status-icon {
  font-size: 32rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.status-icon.status-done { color: #4CAF50; }
.status-icon.status-progress { color: #FF9800; }
.status-icon.status-pending { color: #ccc; }

.item-info {
  flex: 1;
}

.item-name {
  font-size: 28rpx;
  font-weight: 500;
  display: block;
}

.item-name.done {
  text-decoration: line-through;
  color: #ccc;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 6rpx;
}

.item-qty {
  font-size: 24rpx;
  color: #999;
}

.assignee-badge {
  font-size: 20rpx;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  line-height: 40rpx;
}

.assignee-0 { background: #FFF3E0; color: #F57C00; }
.assignee-1 { background: #E3F2FD; color: #1976D2; }
.assignee-2 { background: #FCE4EC; color: #E91E63; }

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
