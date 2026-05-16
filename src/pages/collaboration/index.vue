<template>
  <view class="page">
    <view v-if="stats" class="content">
      <!-- 进度概览 -->
      <view class="overview-card">
        <text class="overview-title">任务进度概览</text>
        <view class="progress-bar-wrap">
          <view class="progress-bar">
            <view class="progress-fill" :style="{ width: completionPercent + '%' }" />
          </view>
          <text class="progress-text">{{ completionPercent }}%</text>
        </view>
        <view class="overview-stats">
          <view class="stat-item">
            <text class="stat-num">{{ total }}</text>
            <text class="stat-label">总任务</text>
          </view>
          <view class="stat-item">
            <text class="stat-num">{{ stats.bothCompleted + stats.groomCompleted + stats.brideCompleted }}</text>
            <text class="stat-label">已完成</text>
          </view>
          <view class="stat-item">
            <text class="stat-num">{{ total - stats.bothCompleted - stats.groomCompleted - stats.brideCompleted }}</text>
            <text class="stat-label">进行中</text>
          </view>
        </view>
      </view>

      <!-- 三栏分配（可点击） -->
      <view class="assign-section">
        <view :class="['assign-card', { 'assign-active': activeTab === 1 }]" @tap="selectTab(1)">
          <view class="assign-header">
            <text class="assign-icon groom-icon">&#x1F466;</text>
            <text class="assign-name">新郎</text>
          </view>
          <view class="assign-progress">
            <view class="mini-bar">
              <view class="mini-fill groom-fill" :style="{ width: getPercent(stats.groomCompleted, stats.groomTotal) + '%' }" />
            </view>
          </view>
          <text class="assign-count">{{ stats.groomCompleted }}/{{ stats.groomTotal }}</text>
        </view>

        <view :class="['assign-card', { 'assign-active': activeTab === 0 }]" @tap="selectTab(0)">
          <view class="assign-header">
            <text class="assign-icon both-icon">&#x1F496;</text>
            <text class="assign-name">共同</text>
          </view>
          <view class="assign-progress">
            <view class="mini-bar">
              <view class="mini-fill both-fill" :style="{ width: getPercent(stats.bothCompleted, stats.bothTotal) + '%' }" />
            </view>
          </view>
          <text class="assign-count">{{ stats.bothCompleted }}/{{ stats.bothTotal }}</text>
        </view>

        <view :class="['assign-card', { 'assign-active': activeTab === 2 }]" @tap="selectTab(2)">
          <view class="assign-header">
            <text class="assign-icon bride-icon">&#x1F467;</text>
            <text class="assign-name">新娘</text>
          </view>
          <view class="assign-progress">
            <view class="mini-bar">
              <view class="mini-fill bride-fill" :style="{ width: getPercent(stats.brideCompleted, stats.brideTotal) + '%' }" />
            </view>
          </view>
          <text class="assign-count">{{ stats.brideCompleted }}/{{ stats.brideTotal }}</text>
        </view>
      </view>

      <!-- 任务明细 -->
      <view v-if="activeTab !== null" class="detail-section">
        <text class="section-title">{{ tabLabel }}的任务明细</text>
        <view v-if="filteredTasks.length" class="detail-list">
          <view v-for="task in filteredTasks" :key="task.id" class="detail-item">
            <view :class="['detail-check', task.status === 2 ? 'done' : task.status === 1 ? 'active' : '']">
              <text v-if="task.status === 2" class="detail-check-icon">{{ '✓' }}</text>
            </view>
            <view class="detail-info">
              <text :class="['detail-title', task.status === 2 ? 'done' : '']">{{ task.title }}</text>
              <view class="detail-meta">
                <text class="detail-status">{{ getStatusText(task.status) }}</text>
                <text v-if="task.deadline" class="detail-deadline">{{ formatDate(task.deadline) }}</text>
              </view>
            </view>
          </view>
        </view>
        <view v-else class="detail-empty">
          <text class="detail-empty-text">暂无{{ tabLabel }}的任务</text>
        </view>
      </view>

      <!-- 最近完成 -->
      <view v-if="stats.recentCompletions && stats.recentCompletions.length" class="recent-section">
        <text class="section-title">最近完成</text>
        <view class="recent-list">
          <view v-for="item in stats.recentCompletions" :key="item.id" class="recent-item">
            <view class="recent-left">
              <text class="recent-check">&#x2705;</text>
              <view class="recent-info">
                <text class="recent-title">{{ item.title }}</text>
                <text class="recent-assignee">{{ getAssigneeLabel(item.assignee) }}</text>
              </view>
            </view>
            <text class="recent-time">{{ formatTime(item.completeTime) }}</text>
          </view>
        </view>
      </view>
    </view>

    <view v-else class="loading">
      <text class="loading-text">加载中...</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getCollaborationStats, type CollaborationStats } from '@/api/collaboration'
import { getTaskList, type Task } from '@/api/task'

const stats = ref<CollaborationStats | null>(null)
const activeTab = ref<number | null>(null)
const allTasks = ref<Task[]>([])

const total = computed(() => {
  if (!stats.value) return 0
  return stats.value.groomTotal + stats.value.brideTotal + stats.value.bothTotal
})

const completionPercent = computed(() => {
  if (!stats.value || total.value === 0) return 0
  const completed = stats.value.groomCompleted + stats.value.brideCompleted + stats.value.bothCompleted
  return Math.round((completed / total.value) * 100)
})

const tabLabel = computed(() => {
  if (activeTab.value === 1) return '新郎'
  if (activeTab.value === 2) return '新娘'
  return '共同'
})

const filteredTasks = computed(() => {
  if (activeTab.value === null) return []
  return allTasks.value.filter(t => t.assignee === activeTab.value)
})

function getPercent(completed: number, total: number): number {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

function getAssigneeLabel(assignee: number): string {
  if (assignee === 0) return '共同完成'
  if (assignee === 1) return '新郎完成'
  return '新娘完成'
}

function getStatusText(status: number): string {
  if (status === 2) return '已完成'
  if (status === 1) return '进行中'
  return '待办'
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} 截止`
}

function formatTime(time: string): string {
  if (!time) return ''
  return time.substring(0, 10)
}

async function selectTab(assignee: number) {
  if (activeTab.value === assignee) {
    activeTab.value = null
    return
  }
  activeTab.value = assignee

  if (allTasks.value.length === 0) {
    try {
      allTasks.value = await getTaskList()
    } catch {
      uni.showToast({ title: '加载任务失败', icon: 'none' })
    }
  }
}

onShow(async () => {
  try {
    stats.value = await getCollaborationStats()
  } catch {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: $wedding-bg;
  padding-bottom: 40rpx;
}

.content {
  padding: 24rpx 32rpx;
}

.overview-card {
  background: #fff;
  border-radius: 32rpx;
  padding: 40rpx 32rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(232, 160, 191, 0.1);
}

.overview-title {
  font-size: 32rpx;
  font-weight: 700;
  color: $wedding-text;
  display: block;
  margin-bottom: 24rpx;
}

.progress-bar-wrap {
  display: flex;
  align-items: center;
  margin-bottom: 32rpx;
}

.progress-bar {
  flex: 1;
  height: 20rpx;
  background: #F5F5F5;
  border-radius: 10rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #E8A0BF, #D4A574);
  border-radius: 10rpx;
}

.progress-text {
  font-size: 28rpx;
  font-weight: 700;
  color: $wedding-primary;
  margin-left: 16rpx;
  min-width: 80rpx;
  text-align: right;
}

.overview-stats {
  display: flex;
  justify-content: space-around;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-num {
  font-size: 40rpx;
  font-weight: 700;
  color: $wedding-text;
}

.stat-label {
  font-size: 24rpx;
  color: #999;
  margin-top: 8rpx;
}

.assign-section {
  display: flex;
  justify-content: space-between;
  margin-bottom: 32rpx;
}

.assign-card {
  width: 31%;
  background: #fff;
  border-radius: 24rpx;
  padding: 28rpx 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  box-shadow: 0 4rpx 16rpx rgba(232, 160, 191, 0.1);
  border: 3rpx solid transparent;
}

.assign-active {
  border-color: $wedding-primary;
  box-shadow: 0 4rpx 16rpx rgba(232, 160, 191, 0.3);
}

.assign-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20rpx;
}

.assign-icon {
  font-size: 48rpx;
  margin-bottom: 8rpx;
}

.assign-name {
  font-size: 26rpx;
  font-weight: 600;
  color: $wedding-text;
}

.assign-progress {
  width: 100%;
  margin-bottom: 16rpx;
}

.mini-bar {
  height: 12rpx;
  background: #F5F5F5;
  border-radius: 6rpx;
  overflow: hidden;
}

.mini-fill {
  height: 100%;
  border-radius: 6rpx;
}

.groom-fill { background: #42A5F5; }
.both-fill { background: #E8A0BF; }
.bride-fill { background: #EF5350; }

.assign-count {
  font-size: 28rpx;
  font-weight: 700;
  color: $wedding-text;
}

// Task detail section

.detail-section {
  background: #fff;
  border-radius: 32rpx;
  padding: 32rpx;
  margin-bottom: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(232, 160, 191, 0.1);
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: $wedding-text;
  display: block;
  margin-bottom: 24rpx;
}

.detail-list {
  display: flex;
  flex-direction: column;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #F5F5F5;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-check {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 3rpx solid #ddd;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16rpx;
  margin-top: 4rpx;
}

.detail-check.done {
  background: #66BB6A;
  border-color: #66BB6A;
}

.detail-check.active {
  border-color: $wedding-primary;
  background: #FFF0F5;
}

.detail-check-icon {
  color: #fff;
  font-size: 20rpx;
}

.detail-info {
  flex: 1;
  min-width: 0;
}

.detail-title {
  font-size: 28rpx;
  color: $wedding-text;
  font-weight: 500;
  display: block;
}

.detail-title.done {
  text-decoration: line-through;
  color: #bbb;
}

.detail-meta {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 8rpx;
}

.detail-status {
  font-size: 22rpx;
  color: #999;
  padding: 2rpx 10rpx;
  border-radius: 8rpx;
  background: #F5F5F5;
}

.detail-deadline {
  font-size: 22rpx;
  color: #999;
}

.detail-empty {
  padding: 40rpx 0;
  text-align: center;
}

.detail-empty-text {
  font-size: 26rpx;
  color: #999;
}

// Recent completions

.recent-section {
  background: #fff;
  border-radius: 32rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 16rpx rgba(232, 160, 191, 0.1);
}

.recent-list {
  display: flex;
  flex-direction: column;
}

.recent-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #F5F5F5;
}

.recent-item:last-child {
  border-bottom: none;
}

.recent-left {
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
}

.recent-check {
  font-size: 32rpx;
  margin-right: 16rpx;
}

.recent-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.recent-title {
  font-size: 28rpx;
  color: $wedding-text;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-assignee {
  font-size: 22rpx;
  color: #999;
  margin-top: 4rpx;
}

.recent-time {
  font-size: 22rpx;
  color: #999;
  margin-left: 16rpx;
  flex-shrink: 0;
}

.loading {
  display: flex;
  justify-content: center;
  padding: 120rpx 0;
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}
</style>
