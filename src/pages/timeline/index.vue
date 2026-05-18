<template>
  <view class="page">

    <!-- Progress Summary Bar -->
    <view class="progress-summary">
      <view class="progress-info">
        <text class="progress-label">当前阶段: {{ currentStageName }}</text>
        <text class="progress-numbers">
          已完成 <text class="progress-highlight">{{ completedCount }}</text> / {{ totalCount }} 项任务
        </text>
      </view>
      <view class="mini-progress">
        <view class="mini-progress-fill" :style="{ width: progressPercent + '%' }"></view>
      </view>
    </view>

    <!-- Vertical Timeline -->
    <view class="timeline-container">

      <view
        v-for="(stage, stageIndex) in stages"
        :key="stage.id"
        :class="['timeline-item', stage.status]"
      >
        <!-- Left column: node + line -->
        <view class="timeline-left">
          <view :class="['timeline-node', stage.status]">
            <text v-if="stage.status === 'completed'" class="node-check">{{ '✓' }}</text>
            <text v-else-if="stage.status === 'active'" class="node-dot">{{ '●' }}</text>
          </view>
          <view
            v-if="stageIndex < stages.length - 1"
            :class="['timeline-line', stage.status]"
          ></view>
        </view>

        <!-- Right column: content -->
        <view class="timeline-right">
          <view class="stage-label" @tap="toggleStage(stage)">
            <view class="stage-info">
              <text :class="['stage-name', stage.status]">{{ stage.name }}</text>
              <text :class="['stage-task-count', stage.status]">{{ stage.summaryText }}</text>
            </view>
            <text :class="['stage-tag', stage.status]">{{ stage.tagText }}</text>
          </view>

          <!-- Task list (expanded stage) -->
          <view v-if="expandedStageId === stage.id && stage.tasks.length > 0" class="task-list">
            <view
              v-for="task in stage.tasks"
              :key="task.id"
              class="swipe-wrap"
              @touchstart="onSwipeStart"
              @touchmove.stop="onSwipeMove"
              @touchend="(e: any) => onSwipeEnd(e, task.id)"
            >
              <view
                :class="['task-card', task.status, 'assignee-' + task.assignee]"
                @tap="handleTaskTap(stage, task)"
              >
                <!-- Checkbox -->
                <view :class="['task-checkbox', task.status]">
                  <text v-if="task.status === 'done'" class="checkbox-icon">{{ '✓' }}</text>
                </view>

                <!-- Task content -->
                <view class="task-content">
                  <view class="task-title-row">
                    <text :class="['task-title', task.status]">{{ task.name }}</text>
                    <text v-if="task.priority" class="priority-star">{{ '★' }}</text>
                  </view>
                  <view class="task-meta">
                    <text :class="['assignee-badge', task.assignee]">{{ task.assigneeLabel }}</text>
                    <text :class="['status-badge', task.status]">
                      <text v-if="task.status === 'in-progress'" class="in-progress-dot"></text>
                      {{ task.statusText }}
                    </text>
                    <text v-if="task.deadline" class="task-deadline">{{ task.deadline }}</text>
                  </view>
                </view>
              </view>
              <view :class="['swipe-del', { show: swipedTaskId === task.id }]" @tap.stop="confirmDelete(task)">
                <text class="swipe-del-text">{{ '删除' }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>

    </view>

    <!-- Bottom spacing for FAB -->
    <view class="content-bottom"></view>

    <!-- FAB Button -->
    <view class="fab" @tap="onFabTap">
      <text class="fab-icon">+</text>
    </view>

    <!-- Add Task Popup -->
    <view v-if="showPopup" class="popup-mask" @tap="closePopup">
      <view class="popup-content" @tap.stop>
        <view class="popup-header">
          <text class="popup-title">添加任务</text>
          <text class="popup-close" @tap="closePopup">&times;</text>
        </view>

        <!-- Title -->
        <view class="form-group">
          <text class="form-label">任务名称 *</text>
          <input
            v-model="formData.title"
            class="form-input"
            placeholder="请输入任务名称"
            maxlength="50"
          />
        </view>

        <!-- Timeline Stage -->
        <view class="form-group">
          <text class="form-label">所属阶段 *</text>
          <view v-if="stages.length === 0" class="stage-empty">
            <text class="stage-empty-text">暂无阶段数据，请先在备婚时间线页面添加阶段</text>
          </view>
          <scroll-view v-else scroll-x class="stage-chips">
            <view
              v-for="stage in stages"
              :key="stage.id"
              class="stage-chip"
              :class="{ active: formData.timelineId === stage.id }"
              @tap="formData.timelineId = stage.id"
            >
              <text>{{ stage.name }}</text>
            </view>
          </scroll-view>
        </view>

        <!-- Assignee -->
        <view class="form-group">
          <text class="form-label">负责人</text>
          <view class="form-picker">
            <view
              class="form-picker-item"
              :class="{ active: formData.assignee === 0 }"
              @tap="formData.assignee = 0"
            >
              <text>共同</text>
            </view>
            <view
              class="form-picker-item"
              :class="{ active: formData.assignee === 1 }"
              @tap="formData.assignee = 1"
            >
              <text>新郎</text>
            </view>
            <view
              class="form-picker-item"
              :class="{ active: formData.assignee === 2 }"
              @tap="formData.assignee = 2"
            >
              <text>新娘</text>
            </view>
          </view>
        </view>

        <!-- Priority -->
        <view class="form-group">
          <text class="form-label">优先级</text>
          <view class="form-picker">
            <view
              class="form-picker-item"
              :class="{ active: formData.priority === 1 }"
              @tap="formData.priority = 1"
            >
              <text>高</text>
            </view>
            <view
              class="form-picker-item"
              :class="{ active: formData.priority === 2 }"
              @tap="formData.priority = 2"
            >
              <text>中</text>
            </view>
            <view
              class="form-picker-item"
              :class="{ active: formData.priority === 3 }"
              @tap="formData.priority = 3"
            >
              <text>低</text>
            </view>
          </view>
        </view>

        <!-- Deadline -->
        <view class="form-group">
          <text class="form-label">截止日期</text>
          <picker mode="date" @change="onDateChange">
            <view class="form-input form-date">{{ formData.deadline || '选择截止日期' }}</view>
          </picker>
        </view>

        <!-- Remind Time -->
        <view class="form-group">
          <text class="form-label">提醒时间</text>
          <picker mode="date" @change="onRemindDateChange">
            <view class="form-input form-date">{{ formData.remindDate || '选择提醒日期' }}</view>
          </picker>
          <picker v-if="formData.remindDate" mode="time" @change="onRemindTimeChange" style="margin-top: 12rpx;">
            <view class="form-input form-date">{{ formData.remindTimeValue || '选择提醒时间' }}</view>
          </picker>
        </view>

        <!-- Actions -->
        <view class="form-actions">
          <button class="form-btn form-btn-cancel" @tap="closePopup">取消</button>
          <button class="form-btn form-btn-submit" @tap="handleSubmit">确定</button>
        </view>
      </view>
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
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { getTimelineList } from '@/api/timeline'
import { getTaskList, getTaskStats, updateTaskStatus, deleteTask, createTask } from '@/api/task'

// ---------- Types ----------

type StageStatus = 'completed' | 'active' | 'upcoming'
type TaskStatus = 'done' | 'in-progress' | 'pending'
type Assignee = 'both' | 'bride' | 'groom'

interface Task {
  readonly id: number
  name: string
  status: TaskStatus
  assignee: Assignee
  assigneeLabel: string
  statusText: string
  deadline: string
  priority: boolean
}

interface Stage {
  readonly id: number
  name: string
  status: StageStatus
  summaryText: string
  tagText: string
  tasks: Task[]
}

// ---------- Helpers ----------

const ASSIGNEE_MAP: Record<number, Assignee> = {
  0: 'both',
  1: 'groom',
  2: 'bride',
}

const ASSIGNEE_LABEL_MAP: Record<Assignee, string> = {
  both: '共同',
  groom: '新郎',
  bride: '新娘',
}

const TASK_STATUS_MAP: Record<number, TaskStatus> = {
  0: 'pending',
  1: 'in-progress',
  2: 'done',
}

const TASK_STATUS_TEXT_MAP: Record<TaskStatus, string> = {
  pending: '待办',
  'in-progress': '进行中',
  done: '\u2713 已完成',
}

function mapApiStatus(raw: number): TaskStatus {
  return TASK_STATUS_MAP[raw] ?? 'pending'
}

function mapApiAssignee(raw: number): Assignee {
  return ASSIGNEE_MAP[raw] ?? 'both'
}

function formatDeadline(raw: string | null): string {
  if (!raw) {
    return ''
  }
  const date = new Date(raw)
  const month = date.getMonth() + 1
  const day = date.getDate()
  return `\uD83D\uDCC5 截止 ${month}月${day}日`
}

function computeStageStatus(tasks: Task[]): StageStatus {
  if (tasks.length === 0) {
    return 'upcoming'
  }
  const allDone = tasks.every((t) => t.status === 'done')
  if (allDone) {
    return 'completed'
  }
  return 'active'
}

function buildStageSummary(status: StageStatus, tasks: Task[]): string {
  if (status === 'completed') {
    return `${tasks.length}项任务已完成`
  }
  if (status === 'upcoming') {
    return tasks.length > 0 ? `${tasks.length}项任务` : '暂无任务'
  }
  const doneCount = tasks.filter((t) => t.status === 'done').length
  return `进行中 \u00B7 ${doneCount}/${tasks.length}已完成`
}

function buildStageTag(status: StageStatus): string {
  if (status === 'completed') {
    return '已完成'
  }
  if (status === 'active') {
    return '当前阶段'
  }
  return '未开始'
}

// ---------- Reactive State ----------

const loading = ref(true)
const expandedStageId = ref(-1)
const stages = ref<Stage[]>([])
const showPopup = ref(false)

interface FormData {
  title: string
  timelineId: number | null
  assignee: number
  priority: number
  deadline: string
  remindDate: string
  remindTimeValue: string
}

function createEmptyForm(): FormData {
  return {
    title: '',
    timelineId: null,
    assignee: 0,
    priority: 2,
    deadline: '',
    remindDate: '',
    remindTimeValue: '',
  }
}

const formData = ref<FormData>(createEmptyForm())
const completedCount = ref(0)
const totalCount = ref(0)

const progressPercent = computed(() => {
  if (totalCount.value === 0) {
    return 0
  }
  return Math.round((completedCount.value / totalCount.value) * 100)
})

const currentStageName = computed(() => {
  const active = stages.value.find((s) => s.status === 'active')
  if (active) return active.name
  const lastCompleted = [...stages.value].reverse().find((s) => s.status === 'completed')
  return lastCompleted ? lastCompleted.name : '未开始'
})

// ---------- Data Loading ----------

async function loadData(): Promise<void> {
  loading.value = true
  try {
    const [timelines, stats] = await Promise.all([
      getTimelineList(),
      getTaskStats(),
    ])

    completedCount.value = stats.completed
    totalCount.value = stats.total

    if (timelines.length === 0) {
      stages.value = []
      return
    }

    const allTasks = await getTaskList()

    const builtStages: Stage[] = timelines.map((tl) => {
      const stageTasks: Task[] = allTasks
        .filter((t) => t.timelineId === tl.id)
        .map((t) => ({
          id: t.id,
          name: t.title,
          status: mapApiStatus(t.status),
          assignee: mapApiAssignee(t.assignee),
          assigneeLabel: ASSIGNEE_LABEL_MAP[mapApiAssignee(t.assignee)],
          statusText: TASK_STATUS_TEXT_MAP[mapApiStatus(t.status)],
          deadline: formatDeadline(t.deadline),
          priority: t.priority === 1,
        }))

      const stageStatus = computeStageStatus(stageTasks)

      return {
        id: tl.id,
        name: tl.title,
        status: stageStatus,
        summaryText: buildStageSummary(stageStatus, stageTasks),
        tagText: buildStageTag(stageStatus),
        tasks: stageTasks,
      }
    })

    stages.value = builtStages

    const activeStage = builtStages.find((s) => s.status === 'active')
    if (activeStage) {
      expandedStageId.value = activeStage.id
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '加载失败'
    uni.showToast({ title: message, icon: 'none' })
  } finally {
    loading.value = false
  }
}

// ---------- Methods ----------

function toggleStage(stage: Stage): void {
  expandedStageId.value = expandedStageId.value === stage.id ? -1 : stage.id
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

function confirmDelete(task: Task): void {
  confirmTaskName.value = task.name
  confirmIsDelete.value = true
  confirmTaskId.value = task.id
  confirmVisible.value = true
}

// ---------- Swipe to delete ----------
const swipedTaskId = ref(-1)
let swipeStartX = 0
let wasSwipe = false

function onSwipeStart(e: any): void {
  swipeStartX = e.touches[0]?.clientX ?? 0
  wasSwipe = false
}

function onSwipeMove(): void {
  // prevent page back gesture interference
}

function onSwipeEnd(e: any, taskId: number): void {
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

function handleTaskTap(stage: Stage, task: Task): void {
  if (wasSwipe) {
    wasSwipe = false
    return
  }
  if (swipedTaskId.value !== -1) {
    swipedTaskId.value = -1
    return
  }
  toggleTask(stage, task)
}

function toggleTask(stage: Stage, task: Task): void {
  // 已完成任务：只能删除
  if (task.status === 'done') {
    confirmDelete(task)
    return
  }

  // 待办→进行中 或 进行中→已完成
  let newApiStatus: number
  let label: string
  let cls: string

  if (task.status === 'pending') {
    newApiStatus = 1
    label = '进行中'
    cls = 'status-active'
  } else {
    newApiStatus = 2
    label = '已完成'
    cls = 'status-done'
  }

  confirmTaskName.value = task.name
  confirmStatusLabel.value = label
  confirmStatusClass.value = cls
  confirmPrefix.value = '标记为'
  confirmNewStatus.value = newApiStatus
  confirmTaskId.value = task.id
  confirmIsDelete.value = false
  confirmVisible.value = true
}

async function doConfirm(): Promise<void> {
  confirmVisible.value = false
  try {
    if (confirmIsDelete.value) {
      await deleteTask(confirmTaskId.value)
    } else {
      await updateTaskStatus(confirmTaskId.value, confirmNewStatus.value)
    }
    await loadData()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '操作失败'
    uni.showToast({ title: message, icon: 'none' })
  }
}

function onFabTap(): void {
  formData.value = createEmptyForm()
  showPopup.value = true
}

function closePopup(): void {
  showPopup.value = false
}

function onDateChange(e: { detail: { value: string } }): void {
  formData.value.deadline = e.detail.value
}

function onRemindDateChange(e: { detail: { value: string } }): void {
  formData.value.remindDate = e.detail.value
  if (!formData.value.remindTimeValue) {
    formData.value.remindTimeValue = '09:00'
  }
}

function onRemindTimeChange(e: { detail: { value: string } }): void {
  formData.value.remindTimeValue = e.detail.value
}

async function handleSubmit(): Promise<void> {
  if (!formData.value.title.trim()) {
    uni.showToast({ title: '请输入任务名称', icon: 'none' })
    return
  }
  if (formData.value.timelineId === null) {
    uni.showToast({ title: '请选择所属阶段', icon: 'none' })
    return
  }

  try {
    const remindTime = formData.value.remindDate && formData.value.remindTimeValue
      ? `${formData.value.remindDate} ${formData.value.remindTimeValue}:00`
      : undefined

    await createTask({
      timelineId: formData.value.timelineId,
      title: formData.value.title.trim(),
      assignee: formData.value.assignee,
      priority: formData.value.priority,
      deadline: formData.value.deadline || undefined,
      remindTime,
    })
    uni.showToast({ title: '添加成功', icon: 'success' })
    showPopup.value = false
    await loadData()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '添加失败'
    uni.showToast({ title: message, icon: 'none' })
  }
}

// ---------- Lifecycle ----------

let pendingStageId: number | null = null
let autoAdd = false

onLoad((query) => {
  if (query?.stageId) {
    pendingStageId = Number(query.stageId)
  }
  if (query?.autoAdd === 'true') {
    autoAdd = true
  }
})

onMounted(() => {
  loadData().then(() => {
    if (pendingStageId !== null) {
      const stage = stages.value.find((s) => s.id === pendingStageId)
      if (stage) {
        expandedStageId.value = stage.id
      }
      pendingStageId = null
    }
    if (autoAdd) {
      onFabTap()
      autoAdd = false
    }
  })
})
</script>

<style lang="scss" scoped>

// ---------- Progress Summary ----------

.progress-summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 24rpx 32rpx 0;
  padding: 24rpx 32rpx;
  background: #ffffff;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(232, 160, 191, 0.1);
}

.progress-info {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.progress-label {
  font-size: 26rpx;
  color: #666666;
}

.progress-numbers {
  font-size: 24rpx;
  color: $wedding-text-light;
}

.progress-highlight {
  color: $wedding-primary;
  font-weight: 600;
}

.mini-progress {
  width: 160rpx;
  height: 12rpx;
  background: #f5f5f5;
  border-radius: 6rpx;
  overflow: hidden;
}

.mini-progress-fill {
  height: 100%;
  border-radius: 6rpx;
  background: linear-gradient(90deg, $wedding-primary, $wedding-accent);
}

// ---------- Timeline Container ----------

.timeline-container {
  padding: 40rpx 32rpx 0;
}

// ---------- Timeline Item ----------

.timeline-item {
  display: flex;
  position: relative;
  min-height: 96rpx;
}

// ---------- Left Column: Line + Node ----------

.timeline-left {
  width: 80rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex-shrink: 0;
  position: relative;
}

.timeline-line {
  width: 4rpx;
  flex: 1;
  background: #E8D0DE;

  &.completed {
    background: #A8D5A2;
  }

  &.active {
    background: linear-gradient(180deg, $wedding-primary 0%, #E8D0DE 100%);
  }
}

.timeline-node {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  position: relative;

  &.completed {
    width: 44rpx;
    height: 44rpx;
    background: #66BB6A;
  }

  &.active {
    width: 60rpx;
    height: 60rpx;
    background: linear-gradient(135deg, $wedding-primary, $wedding-accent);
    box-shadow: 0 0 0 8rpx rgba(232, 160, 191, 0.25);
    animation: pulse 2s ease-in-out infinite;
  }

  &.upcoming {
    background: #ffffff;
    border: 4rpx solid #dddddd;
  }
}

.node-check {
  font-size: 22rpx;
  color: #ffffff;
}

.node-dot {
  font-size: 28rpx;
  color: #ffffff;
}

@keyframes pulse {
  0%, 100% {
    box-shadow: 0 0 0 8rpx rgba(232, 160, 191, 0.25);
  }
  50% {
    box-shadow: 0 0 0 16rpx rgba(232, 160, 191, 0.1);
  }
}

// ---------- Right Column: Stage Content ----------

.timeline-right {
  flex: 1;
  padding-bottom: 32rpx;
  padding-left: 8rpx;
}

.stage-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4rpx 0 16rpx;
}

.stage-info {
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}

.stage-name {
  font-size: 30rpx;
  font-weight: 600;
  color: $wedding-text;

  &.completed {
    color: $wedding-text-light;
    font-weight: 500;
  }

  &.upcoming {
    color: #bbbbbb;
    font-weight: 500;
  }
}

.stage-task-count {
  font-size: 22rpx;
  color: #aaaaaa;

  &.active {
    color: $wedding-accent;
  }
}

.stage-tag {
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;

  &.completed {
    background: #E8F5E9;
    color: #66BB6A;
  }

  &.active {
    background: #FFF0F5;
    color: $wedding-primary;
  }

  &.upcoming {
    background: #F5F5F5;
    color: #cccccc;
  }
}

// ---------- Task Cards ----------

.task-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
  padding-top: 8rpx;
}

.task-card {
  display: flex;
  align-items: flex-start;
  gap: 20rpx;
  padding: 24rpx 28rpx;
  background: #ffffff;
  border-radius: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
  border-left: 6rpx solid $wedding-primary;
  flex: 1;
  min-width: 0;

  &.assignee-bride {
    border-left-color: #E91E63;
  }

  &.assignee-groom {
    border-left-color: #1976D2;
  }

  &.assignee-both {
    border-left-color: #F57C00;
  }
}

// ---------- Task Checkbox ----------

.task-checkbox {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  border: 4rpx solid $wedding-primary;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 2rpx;

  &.done {
    background: #66BB6A;
    border-color: #66BB6A;
  }

  &.in-progress {
    border-color: $wedding-primary;
    background: #FFF0F5;
  }
}

.checkbox-icon {
  font-size: 20rpx;
  color: #ffffff;
}

// ---------- Task Content ----------

.task-content {
  flex: 1;
  min-width: 0;
}

.task-title-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.task-title {
  font-size: 28rpx;
  font-weight: 500;
  color: $wedding-text;

  &.done {
    text-decoration: line-through;
    color: #bbbbbb;
  }
}

.priority-star {
  color: #F57C00;
  font-size: 24rpx;
  flex-shrink: 0;
}

// ---------- Task Meta ----------

.task-meta {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 12rpx;
  font-size: 22rpx;
  color: #aaaaaa;
}

.assignee-badge {
  padding: 2rpx 12rpx;
  border-radius: 16rpx;
  font-size: 20rpx;
  font-weight: 500;

  &.bride {
    background: #FCE4EC;
    color: #E91E63;
  }

  &.groom {
    background: #E3F2FD;
    color: #1976D2;
  }

  &.both {
    background: #FFF3E0;
    color: #F57C00;
  }
}

.status-badge {
  padding: 2rpx 12rpx;
  border-radius: 16rpx;
  font-size: 20rpx;
  font-weight: 500;

  &.done {
    background: #E8F5E9;
    color: #66BB6A;
  }

  &.in-progress {
    background: #FFF0F5;
    color: $wedding-primary;
  }

  &.pending {
    background: #F5F5F5;
    color: #bbbbbb;
  }
}

.in-progress-dot {
  display: inline-block;
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: $wedding-primary;
  margin-right: 6rpx;
  animation: blink 1.4s ease-in-out infinite;
}

@keyframes blink {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.3;
  }
}

.task-deadline {
  display: flex;
  align-items: center;
  gap: 6rpx;
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

// ---------- Bottom Spacing ----------

.content-bottom {
  height: 180rpx;
}

// ---------- FAB Button ----------

.fab {
  position: fixed;
  bottom: 160rpx;
  right: 40rpx;
  width: 104rpx;
  height: 104rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, $wedding-primary, $wedding-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 32rpx rgba(232, 160, 191, 0.4);
  z-index: 90;
}

.fab-icon {
  font-size: 52rpx;
  color: #ffffff;
  line-height: 1;
}

// ---------- Add Task Popup ----------

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

.form-picker {
  display: flex;
  gap: 16rpx;
}

.form-picker-item {
  flex: 1;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  border-radius: 16rpx;
  font-size: 26rpx;
  background: #F8F8F8;
  color: #666;
}

.form-picker-item.active {
  background: $wedding-primary;
  color: #fff;
}

.stage-chips {
  white-space: nowrap;
  height: 80rpx;
}

.stage-empty {
  height: 80rpx;
  display: flex;
  align-items: center;
  background: #F8F8F8;
  border-radius: 16rpx;
  padding: 0 24rpx;
}

.stage-empty-text {
  font-size: 24rpx;
  color: #999;
}

.stage-chip {
  display: inline-block;
  height: 80rpx;
  line-height: 80rpx;
  padding: 0 28rpx;
  border-radius: 16rpx;
  font-size: 26rpx;
  background: #F8F8F8;
  color: #666;
  margin-right: 16rpx;
}

.stage-chip.active {
  background: $wedding-primary;
  color: #fff;
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
