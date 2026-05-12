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
              <text v-if="speech.isTemplate" class="template-badge">系统模板</text>
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
            <view v-if="!speech.isTemplate" class="action-btn delete-btn" @tap="handleDelete(speech)">
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
import { ref, computed } from 'vue'

interface Speech {
  id: number
  category: string
  title: string
  content: string
  isTemplate: boolean
}

const activeCategory = ref('all')

const categories = [
  { key: 'all', label: '全部' },
  { key: 'invitation', label: '结婚邀请' },
  { key: 'speech', label: '婚礼致辞' },
  { key: 'parents', label: '父母发言' },
  { key: 'toast', label: '宴席敬酒' },
  { key: 'thanks', label: '感谢词' },
]

const speeches = ref<Speech[]>([
  {
    id: 1, category: 'invitation', title: '正式版邀请函', isTemplate: true,
    content: '谨定于公历{{婚期}}，为新郎{{新郎名字}}与新娘{{新娘名字}}举行婚礼，敬备喜宴，恭请光临。'
  },
  {
    id: 2, category: 'invitation', title: '朋友圈版', isTemplate: true,
    content: '我们要结婚啦！在这个特别的日子里，我们将携手步入婚姻的殿堂。诚挚邀请您来见证我们的幸福时刻！'
  },
  {
    id: 3, category: 'speech', title: '新郎致辞', isTemplate: true,
    content: '亲爱的各位亲朋好友：大家好！感谢大家在百忙之中抽出时间来参加我们的婚礼。今天是我人生中最重要的日子之一...'
  },
  {
    id: 4, category: 'parents', title: '女方父亲致辞', isTemplate: true,
    content: '各位来宾、各位亲友：今天是我的女儿出嫁的大喜日子。首先感谢大家在百忙之中抽出时间来参加婚礼...'
  },
  {
    id: 5, category: 'toast', title: '敬酒通用话术', isTemplate: true,
    content: '感谢您来参加我们的婚礼，祝您身体健康，万事如意！'
  },
  {
    id: 6, category: 'thanks', title: '感谢词', isTemplate: true,
    content: '感谢各位亲朋好友百忙之中参加我们的婚礼，感谢双方父母的养育之恩...'
  },
])

const filteredSpeeches = computed(() => {
  if (activeCategory.value === 'all') return speeches.value
  return speeches.value.filter(s => s.category === activeCategory.value)
})

function getCategoryLabel(cat: string): string {
  const map: Record<string, string> = {
    invitation: '结婚邀请', speech: '婚礼致辞', parents: '父母发言',
    toast: '宴席敬酒', thanks: '感谢词',
  }
  return map[cat] || cat
}

function getCategoryColor(cat: string): string {
  const map: Record<string, string> = {
    invitation: '#E8A0BF', speech: '#D4A574', parents: '#B5838D',
    toast: '#4CAF50', thanks: '#1976D2',
  }
  return map[cat] || '#999'
}

function getCategoryBg(cat: string): string {
  const map: Record<string, string> = {
    invitation: '#FFF0F5', speech: '#FFF8E1', parents: '#F3E5F5',
    toast: '#E8F5E9', thanks: '#E3F2FD',
  }
  return map[cat] || '#F5F5F5'
}

function handleCopy(speech: Speech) {
  uni.setClipboardData({
    data: speech.content,
    success: () => {
      uni.showToast({ title: '已复制到剪贴板', icon: 'success' })
    },
  })
}

function handleEdit(speech: Speech) {
  uni.showToast({ title: '编辑功能开发中', icon: 'none' })
}

function handleDelete(speech: Speech) {
  uni.showModal({
    title: '确认删除',
    content: `确定要删除"${speech.title}"吗？`,
    success: (res) => {
      if (res.confirm) {
        speeches.value = speeches.value.filter(s => s.id !== speech.id)
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
