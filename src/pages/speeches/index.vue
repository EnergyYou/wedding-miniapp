<template>
  <view class="page">
    <!-- 分类标签 -->
    <scroll-view scroll-x class="category-scroll">
      <view class="category-tabs">
        <view
          v-for="cat in categories"
          :key="cat.key"
          class="category-tab"
          :class="{ active: activeCategory === cat.key }"
          @tap="activeCategory = cat.key"
        >
          <text>{{ cat.label }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 话术卡片列表 -->
    <view class="speech-list">
      <view
        v-for="speech in filteredSpeeches"
        :key="speech.id"
        class="speech-card"
      >
        <view class="card-accent" :style="{ background: getCategoryColor(speech.category) }"></view>
        <view class="card-content">
          <view class="card-top">
            <view class="card-badges">
              <text class="cat-badge" :style="{ background: getCategoryBg(speech.category), color: getCategoryColor(speech.category) }">{{ getCategoryLabel(speech.category) }}</text>
              <text v-if="speech.isTemplate === 1" class="template-badge">系统模板</text>
              <text v-else class="custom-badge">自定义</text>
            </view>
          </view>
          <text class="speech-title">{{ speech.title }}</text>
          <text class="speech-preview">{{ speech.content }}</text>
          <view class="card-actions">
            <view class="action-btn copy-btn" @tap="handleCopy(speech)">
              <text class="action-text">复制</text>
            </view>
            <view class="action-btn edit-btn" @tap="handleEdit(speech)">
              <text class="action-text">编辑</text>
            </view>
            <view v-if="speech.isTemplate !== 1" class="action-btn delete-btn" @tap="handleDelete(speech)">
              <text class="action-text">删除</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- FAB -->
    <view class="fab" @tap="handleAdd">
      <text class="fab-icon">+</text>
      <text class="fab-label">新建话术</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  getSpeechList,
  getSpeechCategories,
  deleteSpeech,
  type Speech,
} from '../../api/speech'

const activeCategory = ref('all')

const categories = ref<{ key: string; label: string }[]>([
  { key: 'all', label: '全部' },
])

const speeches = ref<Speech[]>([])

const filteredSpeeches = computed(() => {
  if (activeCategory.value === 'all') return speeches.value
  return speeches.value.filter(s => s.category === activeCategory.value)
})

async function loadCategories() {
  try {
    const list = await getSpeechCategories()
    categories.value = [
      { key: 'all', label: '全部' },
      ...list.map(c => ({ key: c, label: c })),
    ]
  } catch (e) {
    console.error('加载分类失败', e)
  }
}

async function loadSpeeches() {
  try {
    speeches.value = await getSpeechList()
  } catch (e) {
    console.error('加载话术列表失败', e)
    uni.showToast({ title: '加载失败，请重试', icon: 'none' })
  }
}

onMounted(() => {
  loadCategories()
  loadSpeeches()
})

function getCategoryLabel(cat: string): string {
  return cat
}

const COLOR_PALETTE = ['#E8A0BF', '#D4A574', '#B5838D', '#4CAF50', '#1976D2', '#9C27B0', '#FF5722']
const BG_PALETTE = ['#FFF0F5', '#FFF8E1', '#F3E5F5', '#E8F5E9', '#E3F2FD', '#F3E5F5', '#FBE9E7']

function getCategoryColor(cat: string): string {
  const known: Record<string, string> = {
    '结婚邀请': '#E8A0BF', '婚礼致辞': '#D4A574', '父母发言': '#B5838D',
    '宴席敬酒': '#4CAF50', '感谢词': '#1976D2',
  }
  if (known[cat]) return known[cat]
  const idx = categories.value.findIndex(c => c.key === cat)
  return idx >= 0 ? COLOR_PALETTE[(idx - 1) % COLOR_PALETTE.length] : '#999'
}

function getCategoryBg(cat: string): string {
  const known: Record<string, string> = {
    '结婚邀请': '#FFF0F5', '婚礼致辞': '#FFF8E1', '父母发言': '#F3E5F5',
    '宴席敬酒': '#E8F5E9', '感谢词': '#E3F2FD',
  }
  if (known[cat]) return known[cat]
  const idx = categories.value.findIndex(c => c.key === cat)
  return idx >= 0 ? BG_PALETTE[(idx - 1) % BG_PALETTE.length] : '#F5F5F5'
}

function handleCopy(speech: Speech) {
  uni.setClipboardData({
    data: speech.content || '',
    success: () => {
      uni.showToast({ title: '已复制到剪贴板', icon: 'success' })
    },
  })
}

function handleEdit(_speech: Speech) {
  uni.showToast({ title: '编辑功能开发中', icon: 'none' })
}

function handleDelete(speech: Speech) {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除"${speech.title}"吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteSpeech(speech.id)
          await loadSpeeches()
          uni.showToast({ title: '已删除', icon: 'success' })
        } catch (e) {
          console.error('删除失败', e)
          uni.showToast({ title: '删除失败，请重试', icon: 'none' })
        }
      }
    },
  })
}

function handleAdd() {
  uni.showToast({ title: '新建话术功能开发中', icon: 'none' })
}
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: $wedding-bg;
  padding-bottom: 140rpx;
}

.category-scroll {
  white-space: nowrap;
  padding: 24rpx 32rpx;
}

.category-tabs {
  display: inline-flex;
  gap: 16rpx;
}

.category-tab {
  padding: 12rpx 28rpx;
  border-radius: 40rpx;
  font-size: 26rpx;
  background: #ffffff;
  color: #666;
  border: 1rpx solid #eee;
  flex-shrink: 0;
}

.category-tab.active {
  background: $wedding-primary;
  color: #ffffff;
  border-color: $wedding-primary;
}

.speech-list {
  padding: 0 32rpx;
}

.speech-card {
  background: #ffffff;
  border-radius: 24rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  display: flex;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.card-accent {
  width: 8rpx;
  flex-shrink: 0;
}

.card-content {
  flex: 1;
  padding: 28rpx;
}

.card-top {
  margin-bottom: 12rpx;
}

.card-badges {
  display: flex;
  gap: 12rpx;
}

.cat-badge {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
}

.template-badge {
  font-size: 22rpx;
  background: #E3F2FD;
  color: #1976D2;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
}

.custom-badge {
  font-size: 22rpx;
  background: #FFF3E0;
  color: #F57C00;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
}

.speech-title {
  font-size: 32rpx;
  font-weight: 600;
  color: $wedding-text;
  display: block;
  margin-bottom: 12rpx;
}

.speech-preview {
  font-size: 26rpx;
  color: #666;
  line-height: 1.6;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

.card-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #F5F5F5;
}

.action-btn {
  padding: 10rpx 28rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
}

.copy-btn {
  background: #FFF0F5;
}

.copy-btn .action-text {
  color: $wedding-primary;
}

.edit-btn {
  background: #E3F2FD;
}

.edit-btn .action-text {
  color: #1976D2;
}

.delete-btn {
  background: #FFF3E0;
}

.delete-btn .action-text {
  color: #F57C00;
}

.fab {
  position: fixed;
  bottom: 140rpx;
  right: 32rpx;
  display: flex;
  align-items: center;
  gap: 8rpx;
  padding: 20rpx 36rpx;
  background: linear-gradient(135deg, $wedding-primary, $wedding-accent);
  border-radius: 48rpx;
  box-shadow: 0 8rpx 24rpx rgba(232, 160, 191, 0.4);
  z-index: 100;
}

.fab:active {
  opacity: 0.9;
}

.fab-icon {
  font-size: 36rpx;
  color: #ffffff;
  font-weight: 300;
}

.fab-label {
  font-size: 26rpx;
  color: #ffffff;
  font-weight: 500;
}
</style>
