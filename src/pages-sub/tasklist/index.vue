<template>
  <view class="page">
    <!-- 状态筛选 -->
    <view class="filter-bar">
      <view
        v-for="f in filters"
        :key="f.value"
        :class="['filter-chip', { active: currentFilter === f.value }]"
        @tap="currentFilter = f.value"
      >
        <text>{{ f.label }}</text>
      </view>
    </view>

    <!-- 任务列表 -->
    <view v-if="filteredTasks.length" class="task-list">
      <view
        v-for="task in filteredTasks"
        :key="task.id"
        class="swipe-wrap"
        @touchstart="onSwipeStart"
        @touchmove.stop="onSwipeMove"
        @touchend="(e: any) => onSwipeEnd(e, task.id)"
      >
        <view
          class="task-card"
          @tap="handleTaskTap(task)"
        >
          <view :class="['task-checkbox', task.status === 2 ? 'checked' : task.status === 1 ? 'in-progress' : 'pending']">
            <text v-if="task.status === 2" class="check-icon">{{ '✓' }}</text>
          </view>
          <view class="task-body">
            <view class="task-title-row">
              <text :class="['task-title', task.status === 2 ? 'done' : '']">{{ task.title }}</text>
              <text v-if="task.priority === 1" class="priority-star">{{ '★' }}</text>
            </view>
            <view class="task-meta">
              <text :class="['assignee-badge', `assignee-${getAssigneeKey(task.assignee)}`]">
                {{ getAssigneeLabel(task.assignee) }}
              </text>
              <text v-if="task.deadline" class="meta-text">{{ formatDate(task.deadline) }}</text>
              <text :class="['status-tag', task.status === 2 ? 'status-done' : task.status === 1 ? 'status-active' : 'status-pending']">{{ getStatusText(task.status) }}</text>
            </view>
            <view v-if="task.remindTime" class="task-meta">
              <text class="remind-tag">{{ '🔔' }} {{ formatDateTime(task.remindTime) }}</text>
            </view>
          </view>
        </view>
        <view :class="['swipe-del', { show: swipedTaskId === task.id }]" @tap.stop="confirmDelete(task)">
          <text class="swipe-del-text">{{ '删除' }}</text>
        </view>
      </view>
    </view>

    <view v-else class="empty-state">
      <text class="empty-text">暂无{{ filters.find(f => f.value === currentFilter)?.label }}任务</text>
    </view>

    <!-- Custom Confirm -->
    <view v-if="confirmVisible" class="confirm-mask" @tap="confirmVisible = false">
      <view class="confirm-box" @tap.stop>
        <text class="confirm-title">确认操作</text>
        <view v-if="confirmIsDelete" class="confirm-body">
          <text class="confirm-text">确定要删除</text>
          <text class="confirm-task-name">{{ confirmTaskName }}</text>
          <text class="confirm-text">吗？删除后不可恢复。</text>
        </view>
        <view v-else class="confirm-body">
          <text class="confirm-text">确定要将</text>
          <text class="confirm-task-name">{{ confirmTaskName }}</text>
          <text class="confirm-text">{{ confirmPrefix }}</text>
          <text :class="['confirm-status', confirmStatusClass]">{{ confirmStatusLabel }}</text>
          <text class="confirm-text">吗？</text>
        </view>
        <view class="confirm-buttons">
          <view class="confirm-btn confirm-btn-cancel" @tap="confirmVisible = false">
            <text class="confirm-btn-text">取消</text>
          </view>
          <view :class="['confirm-btn', confirmIsDelete ? 'confirm-btn-danger' : 'confirm-btn-ok']" @tap="doConfirm">
            <text class="confirm-btn-text-ok">{{ confirmIsDelete ? '删除' : '确定' }}</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getTaskList, updateTaskStatus, deleteTask, type Task } from '@/api/task'

const tasks = ref<Task[]>([])
const currentFilter = ref(-1)

const filters = [
  { label: '全部', value: -1 },
  { label: '待办', value: 0 },
  { label: '进行中', value: 1 },
  { label: '已完成', value: 2 },
]

const filteredTasks = computed(() => {
  if (currentFilter.value === -1) return tasks.value
  return tasks.value.filter(t => t.status === currentFilter.value)
})

function getAssigneeKey(assignee: number): string {
  if (assignee === 1) return 'groom'
  if (assignee === 2) return 'bride'
  return 'both'
}

function getAssigneeLabel(assignee: number): string {
  if (assignee === 1) return '新郎'
  if (assignee === 2) return '新娘'
  return '共同'
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

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return ''
  return dateStr.substring(0, 16).replace('T', ' ')
}

// ---------- Custom Confirm ----------
const confirmVisible = ref(false)
const confirmTaskName = ref('')
const confirmStatusLabel = ref('')
const confirmStatusClass = ref('')
const confirmPrefix = ref('')
const confirmNewStatus = ref(0)
const confirmTaskId = ref(0)
const confirmIsDelete = ref(false)

function confirmDelete(task: Task) {
  confirmTaskName.value = task.title
  confirmIsDelete.value = true
  confirmTaskId.value = task.id
  confirmVisible.value = true
}

// ---------- Swipe to delete ----------
const swipedTaskId = ref(-1)
let swipeStartX = 0
let wasSwipe = false

function onSwipeStart(e: any) {
  swipeStartX = e.touches[0]?.clientX ?? 0
  wasSwipe = false
}

function onSwipeMove() {
  // prevent page back gesture interference
}

function onSwipeEnd(e: any, taskId: number) {
  const endX = e.changedTouches[0]?.clientX ?? 0
  const delta = endX - swipeStartX
  if (delta < -40) {
    swipedTaskId.value = taskId
    wasSwipe = true
  } else if (delta > 40) {
    if (swipedTaskId.value === taskId) {
      swipedTaskId.value = -1
    }
    wasSwipe = true
  }
}

function handleTaskTap(task: Task) {
  if (wasSwipe) {
    wasSwipe = false
    return
  }
  if (swipedTaskId.value !== -1) {
    swipedTaskId.value = -1
    return
  }
  toggleTask(task)
}

function toggleTask(task: Task) {
  // 已完成任务：点击无操作，只能左滑删除
  if (task.status === 2) {
    return
  }

  // 待办→进行中 或 进行中→已完成
  let newStatus: number
  let label: string
  let cls: string

  if (task.status === 0) {
    newStatus = 1
    label = '进行中'
    cls = 'status-active'
  } else {
    newStatus = 2
    label = '已完成'
    cls = 'status-done'
  }

  confirmTaskName.value = task.title
  confirmStatusLabel.value = label
  confirmStatusClass.value = cls
  confirmPrefix.value = '标记为'
  confirmNewStatus.value = newStatus
  confirmTaskId.value = task.id
  confirmIsDelete.value = false
  confirmVisible.value = true
}

async function doConfirm() {
  confirmVisible.value = false
  try {
    if (confirmIsDelete.value) {
      await deleteTask(confirmTaskId.value)
    } else {
      await updateTaskStatus(confirmTaskId.value, confirmNewStatus.value)
    }
    await loadData()
  } catch {
    // error shown by interceptor
  }
}

async function loadData() {
  try {
    tasks.value = await getTaskList()
  } catch {
    uni.showToast({ title: '加载失败', icon: 'none' })
  }
}

onShow(() => loadData())
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background: $wedding-bg;
}

.filter-bar {
  display: flex;
  padding: 24rpx 32rpx 0;
  gap: 16rpx;
}

.filter-chip {
  padding: 12rpx 28rpx;
  border-radius: 32rpx;
  background: #fff;
  font-size: 26rpx;
  color: #666;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.filter-chip.active {
  background: linear-gradient(135deg, $wedding-primary, $wedding-accent);
  color: #fff;
}

.task-list {
  padding: 24rpx 32rpx;
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.task-card {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  background: #fff;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  flex: 1;
  min-width: 0;
}

.task-checkbox {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 4rpx solid #ccc;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 4rpx;
}

.task-checkbox.pending {
  border-color: #ccc;
  background: #fff;
}

.task-checkbox.checked {
  background: #66BB6A;
  border-color: #66BB6A;
}

.task-checkbox.in-progress {
  border-color: #2196F3;
  background: #E3F2FD;
}

.check-icon {
  color: #fff;
  font-size: 22rpx;
}

.task-body {
  flex: 1;
  min-width: 0;
}

.task-title-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.task-title {
  font-size: 28rpx;
  font-weight: 500;
  color: $wedding-text;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-title.done {
  text-decoration: line-through;
  color: #bbb;
}

.priority-star {
  color: #F57C00;
  font-size: 22rpx;
  flex-shrink: 0;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-top: 12rpx;
  flex-wrap: wrap;
}

.assignee-badge {
  padding: 2rpx 12rpx;
  border-radius: 12rpx;
  font-size: 20rpx;
  font-weight: 600;
}

.assignee-groom { background: #E3F2FD; color: #1976D2; }
.assignee-bride { background: #FCE4EC; color: #E91E63; }
.assignee-both { background: #FFF3E0; color: #F57C00; }

.meta-text {
  font-size: 22rpx;
  color: #999;
}

.status-tag {
  padding: 2rpx 12rpx;
  border-radius: 8rpx;
  font-size: 20rpx;
  font-weight: 500;
}

.status-tag.status-pending {
  background: #F5F5F5;
  color: #999;
}

.status-tag.status-active {
  background: #E3F2FD;
  color: #2196F3;
}

.status-tag.status-done {
  background: #E8F5E9;
  color: #4CAF50;
}

.remind-tag {
  font-size: 22rpx;
  color: $wedding-primary;
  background: rgba($wedding-primary, 0.1);
  padding: 2rpx 12rpx;
  border-radius: 8rpx;
}

.empty-state {
  display: flex;
  justify-content: center;
  padding: 120rpx 0;
}

// ---------- Swipe to delete ----------
.swipe-wrap {
  display: flex;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
}

.swipe-del {
  width: 0;
  background: #e74c3c;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: width 0.25s ease;
  flex-shrink: 0;
}

.swipe-del.show {
  width: 140rpx;
}

.swipe-del-text {
  color: #fff;
  font-size: 28rpx;
  font-weight: 600;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

// ── Custom Confirm Dialog ──────────────────────────────────
.confirm-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-box {
  width: 600rpx;
  background: #fff;
  border-radius: 32rpx;
  padding: 48rpx 40rpx 36rpx;
}

.confirm-title {
  font-size: 34rpx;
  font-weight: 700;
  color: $wedding-text;
  display: block;
  text-align: center;
  margin-bottom: 36rpx;
}

.confirm-body {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  margin-bottom: 44rpx;
  line-height: 1.8;
}

.confirm-text {
  font-size: 30rpx;
  color: #333;
}

.confirm-task-name {
  font-size: 30rpx;
  font-weight: 600;
  color: $wedding-text;
  margin: 0 4rpx;
  max-width: 300rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.confirm-status {
  font-size: 26rpx;
  font-weight: 700;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  margin: 0 4rpx;
}

.confirm-status.status-pending {
  background: #F5F5F5;
  color: #999;
}

.confirm-status.status-active {
  background: #E3F2FD;
  color: #2196F3;
}

.confirm-status.status-done {
  background: #E8F5E9;
  color: #4CAF50;
}

.confirm-buttons {
  display: flex;
  gap: 20rpx;
}

.confirm-btn {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  border-radius: 40rpx;
}

.confirm-btn-cancel {
  background: #F0F0F0;
}

.confirm-btn-text {
  font-size: 28rpx;
  color: #666;
}

.confirm-btn-ok {
  background: linear-gradient(135deg, $wedding-primary, $wedding-accent);
}

.confirm-btn-danger {
  background: #e74c3c;
}

.confirm-btn-text-ok {
  font-size: 28rpx;
  color: #fff;
  font-weight: 600;
}
</style>
