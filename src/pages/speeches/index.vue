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
            <view v-if="speech.isTemplate !== 1" class="action-btn edit-btn" @tap="handleEdit(speech)">
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

    <!-- 新建/编辑弹窗 -->
    <view v-if="showPopup" class="popup-mask" @tap="showPopup = false">
      <view class="popup-content" @tap.stop>
        <view class="popup-header">
          <text class="popup-title">{{ editingId ? '编辑话术' : '新建话术' }}</text>
          <text class="popup-close" @tap="showPopup = false">&times;</text>
        </view>
        <view class="form-group">
          <text class="form-label">分类</text>
          <input class="form-input" v-model="form.category" placeholder="请输入分类，如：结婚邀请" />
        </view>
        <view class="form-group">
          <text class="form-label">标题</text>
          <input class="form-input" v-model="form.title" placeholder="请输入标题" />
        </view>
        <view class="form-group">
          <text class="form-label">内容</text>
          <textarea class="form-textarea" v-model="form.content" placeholder="请输入话术内容" />
        </view>
        <view class="form-actions">
          <button class="form-btn form-btn-cancel" @tap="showPopup = false">取消</button>
          <button class="form-btn form-btn-submit" @tap="handleSubmit">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  getSpeechList,
  getSpeechCategories,
  createSpeech,
  updateSpeech,
  deleteSpeech,
  type Speech,
} from '../../api/speech'

const activeCategory = ref('all')

const categories = ref<{ key: string; label: string }[]>([
  { key: 'all', label: '全部' },
])

const speeches = ref<Speech[]>([])

const showPopup = ref(false)
const editingId = ref<number | null>(null)
const form = ref({
  category: '',
  title: '',
  content: '',
})

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

function handleEdit(speech: Speech) {
  if (speech.isTemplate === 1) {
    uni.showToast({ title: '系统模板不可编辑', icon: 'none' })
    return
  }
  editingId.value = speech.id
  form.value = {
    category: speech.category,
    title: speech.title,
    content: speech.content || '',
  }
  showPopup.value = true
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
  editingId.value = null
  form.value = {
    category: '',
    title: '',
    content: '',
  }
  showPopup.value = true
}

async function handleSubmit() {
  if (!form.value.title.trim()) {
    uni.showToast({ title: '请输入标题', icon: 'none' })
    return
  }
  try {
    if (editingId.value !== null) {
      await updateSpeech({
        id: editingId.value,
        category: form.value.category,
        title: form.value.title,
        content: form.value.content,
      })
      uni.showToast({ title: '保存成功', icon: 'success' })
    } else {
      await createSpeech({
        category: form.value.category,
        title: form.value.title,
        content: form.value.content,
      })
      uni.showToast({ title: '创建成功', icon: 'success' })
    }
    showPopup.value = false
    await Promise.all([loadSpeeches(), loadCategories()])
  } catch (e) {
    console.error('保存失败', e)
    uni.showToast({ title: '保存失败，请重试', icon: 'none' })
  }
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

.popup-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 200;
  display: flex;
  align-items: flex-end;
}

.popup-content {
  width: 100%;
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  padding: 40rpx 40rpx calc(40rpx + env(safe-area-inset-bottom));
  max-height: 80vh;
  overflow-y: auto;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32rpx;
}

.popup-title {
  font-size: 36rpx;
  font-weight: 700;
  color: $wedding-text;
}

.popup-close {
  font-size: 36rpx;
  color: #999;
  padding: 8rpx;
}

.form-group {
  margin-bottom: 24rpx;
}

.form-label {
  font-size: 26rpx;
  color: $wedding-text-light;
  margin-bottom: 8rpx;
  display: block;
}

.form-input {
  width: 100%;
  height: 80rpx;
  background: #F8F8F8;
  border-radius: 16rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.form-textarea {
  width: 100%;
  height: 240rpx;
  background: #F8F8F8;
  border-radius: 16rpx;
  padding: 24rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.form-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 32rpx;
}

.form-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  font-weight: 500;
  text-align: center;
  border: none;
}

.form-btn::after {
  border: none;
}

.form-btn-cancel {
  background: #F0F0F0;
  color: #666;
}

.form-btn-submit {
  background: linear-gradient(135deg, $wedding-primary, $wedding-accent);
  color: #fff;
}
</style>
