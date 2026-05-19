<template>
  <view class="page">
    <!-- 提醒任务列表 -->
    <view v-if="filteredTasks.length" class="task-list">
      <view v-for="task in filteredTasks" :key="task.id" class="task-card">
        <view class="task-header">
          <text class="task-title">{{ task.title }}</text>
          <view class="task-badges">
            <text v-if="task.remindSent === 1" class="badge-reminded">已提醒</text>
            <text :class="['task-status', task.status === 2 ? 'done' : task.status === 1 ? 'active' : 'pending']">
              {{ task.status === 2 ? '已完成' : task.status === 1 ? '进行中' : '待办' }}
            </text>
          </view>
        </view>
        <view class="task-meta">
          <view class="meta-row">
            <text class="meta-icon">&#x1F552;</text>
            <text class="meta-text">提醒时间：{{ formatTime(task.remindTime) }}</text>
          </view>
          <view v-if="task.deadline" class="meta-row">
            <text class="meta-icon">&#x1F4C5;</text>
            <text class="meta-text">截止日期：{{ formatTime(task.deadline) }}</text>
          </view>
          <view class="meta-row">
            <text class="meta-icon">&#x1F465;</text>
            <text class="meta-text">{{ getAssigneeLabel(task.assignee) }}</text>
          </view>
        </view>
        <view class="task-actions">
          <view class="action-btn action-edit" @tap="editRemind(task)">
            <text class="action-text">修改提醒</text>
          </view>
          <view class="action-btn action-cancel" @tap="cancelRemind(task)">
            <text class="action-text">取消提醒</text>
          </view>
        </view>
      </view>
    </view>

    <view v-if="!filteredTasks.length" class="empty-state">
      <text class="empty-icon">&#x1F514;</text>
      <text class="empty-text">暂无设置提醒的任务</text>
      <text class="empty-hint">在添加或编辑任务时可以设置提醒时间</text>
    </view>

    <!-- 修改提醒弹窗 -->
    <view v-if="showEditPopup" class="popup-mask" @tap="showEditPopup = false">
      <view class="popup-content" @tap.stop>
        <view class="popup-header">
          <text class="popup-title">修改提醒时间</text>
          <text class="popup-close" @tap="showEditPopup = false">&times;</text>
        </view>
        <view class="popup-task-name">{{ editingTask?.title }}</view>
        <view class="form-group">
          <text class="form-label">提醒日期</text>
          <picker mode="date" @change="onRemindDateChange">
            <view class="form-input form-date">{{ editRemindDate || '选择日期' }}</view>
          </picker>
        </view>
        <view class="form-group">
          <text class="form-label">提醒时间</text>
          <picker mode="time" @change="onRemindTimeChange">
            <view class="form-input form-date">{{ editRemindTime || '选择时间' }}</view>
          </picker>
        </view>
        <view class="form-actions">
          <button class="form-btn form-btn-cancel" @tap="showEditPopup = false">取消</button>
          <button class="form-btn form-btn-submit" @tap="confirmEdit">确定</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getTasksWithReminders, updateTaskRemind, type Task } from '@/api/task'

const tasks = ref<Task[]>([])

// 已完成的任务不展示，未完成的按截止时间排序
const filteredTasks = computed(() =>
  tasks.value
    .filter(t => t.status !== 2)
    .sort((a, b) => {
      const da = a.deadline ? new Date(a.deadline).getTime() : Infinity
      const db = b.deadline ? new Date(b.deadline).getTime() : Infinity
      return da - db
    })
)

const showEditPopup = ref(false)
const editingTask = ref<Task | null>(null)
const editRemindDate = ref('')
const editRemindTime = ref('')

function formatTime(time: string | null): string {
  if (!time) return '未设置'
  return time.substring(0, 16).replace('T', ' ')
}

function getAssigneeLabel(assignee: number): string {
  if (assignee === 0) return '共同负责'
  if (assignee === 1) return '新郎负责'
  return '新娘负责'
}

function editRemind(task: Task) {
  editingTask.value = task
  if (task.remindTime) {
    editRemindDate.value = task.remindTime.substring(0, 10)
    editRemindTime.value = task.remindTime.substring(11, 16)
  } else {
    editRemindDate.value = ''
    editRemindTime.value = ''
  }
  showEditPopup.value = true
}

function onRemindDateChange(e: { detail: { value: string } }) {
  editRemindDate.value = e.detail.value
}

function onRemindTimeChange(e: { detail: { value: string } }) {
  editRemindTime.value = e.detail.value
}

async function confirmEdit() {
  if (!editingTask.value) return
  if (!editRemindDate.value || !editRemindTime.value) {
    uni.showToast({ title: '请选择日期和时间', icon: 'none' })
    return
  }

  const remindTime = `${editRemindDate.value} ${editRemindTime.value}:00`

  // 请求订阅消息授权
  try {
    // @ts-ignore 微信小程序订阅消息
    uni.requestSubscribeMessage({
      tmplIds: [import.meta.env.VITE_WX_TEMPLATE_ID || ''],
      success: (res: any) => {
        console.log('requestSubscribeMessage success:', res)
      },
      fail: (err: any) => {
        console.error('requestSubscribeMessage fail:', err)
        uni.showToast({ title: '订阅授权失败: ' + (err.errMsg || ''), icon: 'none', duration: 3000 })
      },
    })
  } catch (e: any) {
    console.error('requestSubscribeMessage error:', e)
  }

  try {
    await updateTaskRemind(editingTask.value.id, remindTime)
    uni.showToast({ title: '修改成功', icon: 'success' })
    showEditPopup.value = false
    await loadData()
  } catch {
    uni.showToast({ title: '修改失败', icon: 'none' })
  }
}

async function cancelRemind(task: Task) {
  const { confirm } = await uni.showModal({
    title: '取消提醒',
    content: `确定要取消"${task.title}"的提醒吗？`,
  })
  if (!confirm) return

  try {
    await updateTaskRemind(task.id, null)
    uni.showToast({ title: '已取消提醒', icon: 'success' })
    await loadData()
  } catch {
    uni.showToast({ title: '取消失败', icon: 'none' })
  }
}

async function loadData() {
  try {
    tasks.value = await getTasksWithReminders()
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
  padding: 24rpx 32rpx 40rpx;
}

.task-list {
  display: flex;
  flex-direction: column;
}

.task-card {
  background: #fff;
  border-radius: 24rpx;
  padding: 28rpx 32rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(232, 160, 191, 0.1);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.task-badges {
  display: flex;
  align-items: center;
  gap: 8rpx;
  flex-shrink: 0;
  margin-left: 16rpx;
}

.badge-reminded {
  font-size: 20rpx;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  background: #E3F2FD;
  color: #1976D2;
}

.task-title {
  font-size: 30rpx;
  font-weight: 600;
  color: $wedding-text;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.task-status {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
  margin-left: 16rpx;
}

.task-status.done {
  background: #E8F5E9;
  color: #4CAF50;
}

.task-status.active {
  background: #FFF3E0;
  color: #F57C00;
}

.task-status.pending {
  background: #F5F5F5;
  color: #999;
}

.task-meta {
  display: flex;
  flex-direction: column;
}

.meta-row {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}

.meta-row:last-child {
  margin-bottom: 0;
}

.meta-icon {
  font-size: 24rpx;
  margin-right: 8rpx;
}

.meta-text {
  font-size: 24rpx;
  color: #666;
}

.task-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #F5F5F5;
}

.action-btn {
  flex: 1;
  height: 64rpx;
  line-height: 64rpx;
  text-align: center;
  border-radius: 12rpx;
}

.action-edit {
  background: rgba($wedding-primary, 0.1);
}

.action-edit .action-text {
  color: $wedding-primary;
  font-size: 24rpx;
  font-weight: 500;
}

.action-cancel {
  background: #F5F5F5;
}

.action-cancel .action-text {
  color: #999;
  font-size: 24rpx;
  font-weight: 500;
}

// Popup

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
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
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

.popup-task-name {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 24rpx;
}

.form-group {
  margin-bottom: 24rpx;
}

.form-label {
  font-size: 26rpx;
  color: #666;
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

.form-date {
  display: flex;
  align-items: center;
  color: #999;
  line-height: 80rpx;
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

// Empty state

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;
}

.empty-icon {
  font-size: 80rpx;
  margin-bottom: 24rpx;
}

.empty-text {
  font-size: 30rpx;
  color: $wedding-text-light;
  margin-bottom: 12rpx;
}

.empty-hint {
  font-size: 24rpx;
  color: #999;
}
</style>
