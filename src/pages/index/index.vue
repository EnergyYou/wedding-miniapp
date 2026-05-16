<template>
  <view class="page">
    <!-- Not Logged In -->
    <view v-if="!isLoggedIn" class="login-state">
      <view class="header-gradient" :style="{ paddingTop: statusBarHeight + 'px' }">
        <view class="header-content">
          <text class="app-title">备婚清单</text>
          <text class="app-subtitle">让你的婚礼筹备井井有条</text>
        </view>
      </view>
      <view class="login-card">
        <text class="login-desc">登录后即可开始备婚之旅</text>
        <button class="login-btn" @tap="handleLogin">微信一键登录</button>
      </view>
    </view>

    <!-- Logged In But Not Bound -->
    <view v-else-if="!isCoupleBound" class="unbound-state">
      <view class="header-gradient" :style="{ paddingTop: statusBarHeight + 'px' }">
        <view class="header-content">
          <text class="greeting-text">Hi, {{ userStore.nickName || '新用户' }}</text>
          <text class="app-subtitle">邀请你的另一半，一起备婚吧</text>
        </view>
      </view>
      <view class="invite-card">
        <view class="invite-icon-wrap">
          <text class="invite-icon-text">&#x1F491;</text>
        </view>
        <text class="invite-title">绑定另一半</text>
        <text class="invite-desc">绑定后可以共享备婚进度、协同管理任务</text>
        <button class="invite-btn" @tap="goToCoupleBind">邀请另一半</button>
      </view>
    </view>

    <!-- Fully Bound - Dashboard -->
    <view v-else class="dashboard-state">
      <scroll-view scroll-y class="dashboard-scroll" :style="{ paddingTop: '0px' }">
        <!-- Countdown Header -->
        <view class="header-gradient header-rounded" :style="{ paddingTop: statusBarHeight + 'px' }">
          <view class="header-content">
            <text class="couple-names">{{ coupleStore.partnerName || '小明' }} &#x2764; {{ userStore.nickName || '小红' }}</text>
            <view class="countdown-wrap">
              <text class="countdown-number">{{ countdownDays }}</text>
              <text class="countdown-label">天后步入婚姻殿堂</text>
            </view>
            <text class="wedding-date">{{ formattedWeddingDate }}</text>
          </view>
        </view>

        <view class="dashboard-body">
          <!-- Progress Overview -->
          <view class="card progress-card">
            <view class="card-header">
              <text class="card-title">备婚进度</text>
              <view class="badge">
                <text class="badge-text">{{ completedCount }}/{{ totalTasks }} 已完成</text>
              </view>
            </view>
            <view class="progress-bar-bg">
              <view class="progress-bar-fill" :style="{ width: progressPercent + '%' }" />
            </view>
            <view class="progress-stats">
              <text class="progress-stage">当前阶段: {{ currentStage }}</text>
              <text class="progress-percent">{{ progressPercent }}%</text>
            </view>
          </view>

          <!-- Timeline Quick View -->
          <view class="section">
            <view class="section-header">
              <text class="section-title">备婚时间线</text>
              <text class="section-link" @tap="goToTimeline()">查看全部 &gt;</text>
            </view>
            <scroll-view v-if="timelineStages.length > 0" scroll-x class="timeline-chips" :show-scrollbar="false">
              <view
                v-for="stage in timelineStages"
                :key="stage.id"
                :class="['timeline-chip', { 'chip-completed': stage.completed, 'chip-active': stage.active }]"
                @tap="goToTimeline(stage.id)"
              >
                <text :class="['chip-icon', stage.completed ? 'icon-check' : stage.active ? 'icon-active' : 'icon-default']">
                  {{ stage.completed ? '\u2713' : stage.active ? '\u25CF' : '' }}
                </text>
                <text :class="['chip-label', { 'chip-label-completed': stage.completed, 'chip-label-active': stage.active }]">
                  {{ stage.label }}
                </text>
              </view>
            </scroll-view>
            <view v-else class="empty-hint">
              <text class="empty-hint-text">暂无时间线数据</text>
            </view>
          </view>

          <!-- Current Tasks -->
          <view class="section">
            <view class="section-header">
              <text class="section-title">当前任务</text>
              <view class="section-actions">
                <text class="section-link add-task-btn" @tap="goToAddTask">{{ '+' }}</text>
                <text class="section-link" @tap="goToTaskList()">查看全部 &gt;</text>
              </view>
            </view>
            <view v-if="currentTasks.length > 0" class="task-list">
              <view
                v-for="task in currentTasks"
                :key="task.id"
                class="task-card"
              >
                <view class="task-left">
                  <view :class="['task-checkbox', task.status === 2 ? 'task-checkbox-checked' : task.status === 1 ? 'task-checkbox-progress' : 'task-checkbox-pending']" @tap="toggleTask(task)">
                    <text v-if="task.status === 2" class="check-mark">{{ '\u2713' }}</text>
                  </view>
                </view>
                <view class="task-body">
                  <text :class="['task-name', { 'task-name-done': task.status === 2 }]">{{ task.name }}</text>
                  <view class="task-meta">
                    <text v-if="task.stageName" class="task-stage-tag">{{ task.stageName }}</text>
                    <view :class="['assignee-badge', `assignee-${task.assignee}`]">
                      <text class="assignee-text">{{ assigneeLabel(task.assignee) }}</text>
                    </view>
                    <text class="task-deadline">{{ task.deadline }}</text>
                    <text v-if="task.status === 1" class="status-in-progress">{{ statusLabel(task.status) }}</text>
                    <text v-if="task.priority" class="task-priority">{{ '\u2b50' }}</text>
                  </view>
                </view>
              </view>
            </view>
            <view v-else class="empty-hint">
              <text class="empty-hint-text">暂无待办任务，太棒了！</text>
            </view>
          </view>

          <!-- Quick Actions -->
          <view class="section">
            <view class="section-header">
              <text class="section-title">快捷入口</text>
            </view>
            <view class="quick-actions">
              <view class="action-item" @tap="goToBudget">
                <view class="action-icon action-icon-pink">
                  <text class="action-icon-text">&#x1F4B0;</text>
                </view>
                <text class="action-label">预算管理</text>
              </view>
              <view class="action-item" @tap="goToItems">
                <view class="action-icon action-icon-orange">
                  <text class="action-icon-text">&#x1F4E6;</text>
                </view>
                <text class="action-label">物品清单</text>
              </view>
              <view class="action-item" @tap="goToVendors">
                <view class="action-icon action-icon-green">
                  <text class="action-icon-text">&#x1F3E2;</text>
                </view>
                <text class="action-label">供应商</text>
              </view>
              <view class="action-item" @tap="goToSpeeches">
                <view class="action-icon action-icon-blue">
                  <text class="action-icon-text">&#x1F4AC;</text>
                </view>
                <text class="action-label">婚礼话术</text>
              </view>
            </view>
          </view>

          <!-- Bottom Safe Area -->
          <view class="bottom-spacer" />
        </view>
      </scroll-view>
    </view>

    <!-- 自定义确认弹窗 -->
    <view v-if="confirmVisible" class="confirm-mask" @tap="confirmVisible = false">
      <view class="confirm-box" @tap.stop>
        <text class="confirm-title">确认操作</text>
        <view class="confirm-body">
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
          <view class="confirm-btn confirm-btn-ok" @tap="doConfirm">
            <text class="confirm-btn-text-ok">确定</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { useCoupleStore } from '@/store/couple'
import { silentLogin } from '@/utils/auth'
import { getCoupleInfo } from '@/api/couple'
import { getTimelineList, type Timeline } from '@/api/timeline'
import { getTaskList, getTaskStats, updateTaskStatus, type Task as ApiTask, type TaskStats } from '@/api/task'

// ── Types ──────────────────────────────────────────────────
interface Task {
  readonly id: number
  readonly name: string
  readonly stageName: string
  readonly assignee: 'groom' | 'bride' | 'both'
  readonly deadline: string
  readonly priority: boolean
  completed: boolean
  readonly status: number
}

interface TimelineStage {
  readonly id: number
  readonly label: string
  readonly completed: boolean
  readonly active: boolean
}

// ── Stores ─────────────────────────────────────────────────
const userStore = useUserStore()
const coupleStore = useCoupleStore()

const isLoggedIn = computed(() => !!userStore.token)
const isCoupleBound = computed(() => coupleStore.isBound)

// ── Status bar height ──────────────────────────────────────
const statusBarHeight = ref(44)

onMounted(() => {
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight ?? 44
})

// ── Refresh couple status on show ──────────────────────────
onShow(async () => {
  if (userStore.token && !coupleStore.isBound) {
    try {
      const coupleInfo = await getCoupleInfo()
      coupleStore.setCoupleInfo({
        coupleId: String(coupleInfo.coupleId),
        weddingDate: coupleInfo.weddingDate || '',
        partnerName: coupleInfo.partnerName || '',
      })
    } catch {
      // 未绑定，忽略
    }
  }
  // 已绑定时刷新仪表盘数据
  if (coupleStore.isBound) {
    await loadDashboardData()
  }
})

// ── Load dashboard data when bound ─────────────────────────
watch(isCoupleBound, (bound) => {
  if (bound) {
    loadDashboardData()
  }
}, { immediate: true })

// Keep a local map of timelineId -> title for task stage labels
const timelineIdToTitle = ref<Record<number, string>>({})

async function loadDashboardData() {
  try {
    const [timelines, stats, tasks] = await Promise.all([
      getTimelineList(),
      getTaskStats(),
      getTaskList(),
    ])
    // Build timeline id->title map for task stage labels
    const idMap: Record<number, string> = {}
    for (const tl of timelines) {
      idMap[tl.id] = tl.title
    }
    timelineIdToTitle.value = idMap

    buildTimelineStages(timelines, tasks)
    applyStats(stats)
    buildTaskList(tasks)
  } catch {
    // Keep empty state
  }
}

// ── Login ──────────────────────────────────────────────────
async function handleLogin() {
  const success = await silentLogin()
  if (!success) {
    uni.showToast({ title: '登录失败，请重试', icon: 'none' })
  }
}

// ── Navigation ─────────────────────────────────────────────
function goToCoupleBind() {
  uni.navigateTo({ url: '/pages/couple/index' })
}

function goToTimeline(stageId?: number) {
  const url = stageId
    ? `/pages/timeline/index?stageId=${stageId}`
    : '/pages/timeline/index'
  uni.navigateTo({ url })
}

function goToTaskList() {
  uni.navigateTo({ url: '/pages/tasklist/index' })
}

function goToAddTask() {
  uni.navigateTo({ url: '/pages/timeline/index?autoAdd=true' })
}

function goToBudget() {
  uni.switchTab({ url: '/pages/budget/index' })
}

function goToItems() {
  uni.navigateTo({ url: '/pages/items/index' })
}

function goToVendors() {
  uni.navigateTo({ url: '/pages/vendors/index' })
}

function goToSpeeches() {
  uni.navigateTo({ url: '/pages/speeches/index' })
}

// ── Wedding countdown ──────────────────────────────────────
const countdownDays = computed(() => {
  const dateStr = coupleStore.weddingDate
  if (!dateStr) {
    return 0
  }
  const target = new Date(dateStr)
  const now = new Date()
  const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  return diff > 0 ? diff : 0
})

const formattedWeddingDate = computed(() => {
  const dateStr = coupleStore.weddingDate
  if (!dateStr) {
    return ''
  }
  const d = new Date(dateStr)
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  const day = d.getDate()
  const weekday = weekdays[d.getDay()]
  return `${year}年${month}月${day}日 \u00B7 ${weekday}`
})

// ── Progress data ──────────────────────────────────────────
const completedCount = ref(0)
const totalTasks = ref(0)
const progressPercent = computed(() =>
  totalTasks.value > 0 ? Math.round((completedCount.value / totalTasks.value) * 100) : 0
)
const currentStage = ref('')

function applyStats(stats: TaskStats) {
  completedCount.value = stats.completed
  totalTasks.value = stats.total
}

// ── Timeline stages ────────────────────────────────────────
const timelineStages = ref<ReadonlyArray<TimelineStage>>([])

function buildTimelineStages(timelines: Timeline[], tasks: ApiTask[]) {
  if (!timelines || timelines.length === 0) {
    timelineStages.value = []
    return
  }

  // Group tasks by timelineId to compute per-stage completion
  const tasksByTimeline: Record<number, ApiTask[]> = {}
  for (const t of tasks) {
    const key = t.timelineId ?? 0
    if (!tasksByTimeline[key]) tasksByTimeline[key] = []
    tasksByTimeline[key].push(t)
  }

  let foundActive = false
  const stages: TimelineStage[] = timelines.map((tl) => {
    const stageTasks = tasksByTimeline[tl.id] ?? []
    const allDone = stageTasks.length > 0 && stageTasks.every((t) => t.status === 2)
    const hasPending = stageTasks.some((t) => t.status !== 2)

    let completed = false
    let active = false

    if (allDone && stageTasks.length > 0) {
      completed = true
    } else if (hasPending && !foundActive) {
      active = true
      foundActive = true
    }
    // else: upcoming (not completed, not active)

    return {
      id: tl.id,
      label: tl.title,
      completed,
      active,
    }
  })

  timelineStages.value = stages

  // Update current stage label
  const active = stages.find((s) => s.active)
  if (active) {
    currentStage.value = active.label
  } else if (stages.length > 0) {
    const lastCompleted = [...stages].reverse().find((s) => s.completed)
    currentStage.value = lastCompleted ? lastCompleted.label : stages[0].label
  }
}

// ── Task list ──────────────────────────────────────────────
const currentTasks = ref<Task[]>([])
const allTasksApi = ref<ApiTask[]>([])

const assigneeMap: Record<number, 'groom' | 'bride' | 'both'> = { 0: 'both', 1: 'groom', 2: 'bride' }

function formatDeadline(dateStr: string | null): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function buildTaskList(tasks: ApiTask[]) {
  if (!tasks || tasks.length === 0) {
    currentTasks.value = []
    allTasksApi.value = []
    return
  }
  allTasksApi.value = tasks
  // Show only pending/in-progress tasks (limit 5)
  const pending = tasks.filter((t) => t.status !== 2).slice(0, 5)
  currentTasks.value = pending.map((t) => ({
    id: t.id,
    name: t.title,
    stageName: t.timelineId ? (timelineIdToTitle.value[t.timelineId] ?? '') : '',
    assignee: assigneeMap[t.assignee] ?? 'both',
    deadline: formatDeadline(t.deadline),
    priority: t.priority === 1,
    completed: t.status === 2,
    status: t.status,
  }))
}

// ── Custom Confirm Dialog ──────────────────────────────────
const confirmVisible = ref(false)
const confirmTaskName = ref('')
const confirmStatusLabel = ref('')
const confirmStatusClass = ref('')
const confirmPrefix = ref('')
const confirmNewStatus = ref(0)
const confirmTaskId = ref(0)

function toggleTask(task: Task) {
  let newStatus: number
  let label: string
  let cls: string
  let prefix: string

  if (task.completed) {
    newStatus = 0
    label = '待办'
    cls = 'status-pending'
    prefix = '重新设为'
  } else {
    const apiTask = allTasksApi.value.find(t => t.id === task.id)
    if (apiTask && apiTask.status === 0) {
      newStatus = 1
      label = '进行中'
      cls = 'status-active'
      prefix = '标记为'
    } else {
      newStatus = 2
      label = '已完成'
      cls = 'status-done'
      prefix = '标记为'
    }
  }

  confirmTaskName.value = task.name
  confirmStatusLabel.value = label
  confirmStatusClass.value = cls
  confirmPrefix.value = prefix
  confirmNewStatus.value = newStatus
  confirmTaskId.value = task.id
  confirmVisible.value = true
}

async function doConfirm() {
  confirmVisible.value = false
  try {
    await updateTaskStatus(confirmTaskId.value, confirmNewStatus.value)
    await loadDashboardData()
  } catch {
    // Error already shown by request interceptor
  }
}

function assigneeLabel(assignee: Task['assignee']): string {
  const map: Record<Task['assignee'], string> = { groom: '郎', bride: '娘', both: '共' }
  return map[assignee]
}

function statusLabel(status: number): string {
  if (status === 2) return '已完成'
  if (status === 1) return '进行中'
  return '待办'
}
</script>

<style lang="scss" scoped>
// ── Shared gradient header ─────────────────────────────────
.header-gradient {
  background: linear-gradient(135deg, $wedding-primary 0%, $wedding-accent 100%);
  padding-bottom: 48rpx;
}

.header-rounded {
  border-radius: 0 0 40rpx 40rpx;
}

.header-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 32rpx 40rpx 16rpx;
}

// ── Not logged in ──────────────────────────────────────────
.login-state {
  min-height: 100vh;
  background-color: $wedding-bg;
}

.app-title {
  font-size: 56rpx;
  font-weight: 700;
  color: #ffffff;
}

.app-subtitle {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.85);
  margin-top: 12rpx;
}

.login-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 80rpx 60rpx 0;
  padding: 80rpx 40rpx;
  background-color: #ffffff;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);
}

.login-desc {
  font-size: 30rpx;
  color: $wedding-text-light;
  margin-bottom: 48rpx;
}

.login-btn {
  width: 480rpx;
  height: 88rpx;
  line-height: 88rpx;
  background: linear-gradient(135deg, $wedding-primary 0%, $wedding-accent 100%);
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 600;
  border-radius: 44rpx;
  border: none;
  text-align: center;
}

// ── Not bound ──────────────────────────────────────────────
.unbound-state {
  min-height: 100vh;
  background-color: $wedding-bg;
}

.greeting-text {
  font-size: 44rpx;
  font-weight: 700;
  color: #ffffff;
}

.invite-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 80rpx 60rpx 0;
  padding: 80rpx 40rpx;
  background-color: #ffffff;
  border-radius: 24rpx;
  box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.06);
}

.invite-icon-wrap {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  background: linear-gradient(135deg, rgba($wedding-primary, 0.15), rgba($wedding-accent, 0.15));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
}

.invite-icon-text {
  font-size: 56rpx;
}

.invite-title {
  font-size: 36rpx;
  font-weight: 700;
  color: $wedding-text;
  margin-bottom: 16rpx;
}

.invite-desc {
  font-size: 26rpx;
  color: $wedding-text-light;
  text-align: center;
  margin-bottom: 48rpx;
  line-height: 1.6;
}

.invite-btn {
  width: 480rpx;
  height: 88rpx;
  line-height: 88rpx;
  background: linear-gradient(135deg, $wedding-primary 0%, $wedding-accent 100%);
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 600;
  border-radius: 44rpx;
  border: none;
  text-align: center;
}

// ── Dashboard ──────────────────────────────────────────────
.dashboard-state {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: $wedding-bg;
}

.dashboard-scroll {
  flex: 1;
  height: 0;
}

.dashboard-body {
  padding: 24rpx 32rpx;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
}

// ── Countdown header ───────────────────────────────────────
.couple-names {
  font-size: 36rpx;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 2rpx;
}

.countdown-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 24rpx 0 16rpx;
}

.countdown-number {
  font-size: 128rpx;
  font-weight: 800;
  color: #ffffff;
  line-height: 1.1;
}

.countdown-label {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.9);
  margin-top: 8rpx;
}

.wedding-date {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 8rpx;
}

// ── Card shared ────────────────────────────────────────────
.card {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 32rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.05);
  margin-bottom: 24rpx;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24rpx;
}

.card-title {
  font-size: 32rpx;
  font-weight: 700;
  color: $wedding-text;
}

.badge {
  background-color: rgba($wedding-primary, 0.12);
  padding: 8rpx 20rpx;
  border-radius: 20rpx;
}

.badge-text {
  font-size: 24rpx;
  color: $wedding-primary;
  font-weight: 600;
}

// ── Progress bar ───────────────────────────────────────────
.progress-card {
  margin-top: -24rpx;
  position: relative;
  z-index: 1;
}

.progress-bar-bg {
  height: 16rpx;
  background-color: #f0f0f0;
  border-radius: 8rpx;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, $wedding-primary 0%, $wedding-accent 100%);
  border-radius: 8rpx;
  transition: width 0.3s ease;
}

.progress-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16rpx;
}

.progress-stage {
  font-size: 24rpx;
  color: $wedding-text-light;
}

.progress-percent {
  font-size: 28rpx;
  font-weight: 700;
  color: $wedding-primary;
}

// ── Section ────────────────────────────────────────────────
.section {
  margin-bottom: 32rpx;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
  padding: 0 4rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: $wedding-text;
}

.section-link {
  font-size: 26rpx;
  color: $wedding-text-light;
}

.section-actions {
  display: flex;
  align-items: center;
  gap: 24rpx;
}

.add-task-btn {
  width: 44rpx;
  height: 44rpx;
  line-height: 40rpx;
  text-align: center;
  background: linear-gradient(135deg, $wedding-primary, $wedding-accent);
  color: #fff;
  border-radius: 50%;
  font-size: 32rpx;
  font-weight: 700;
}

// ── Timeline chips ─────────────────────────────────────────
.timeline-chips {
  white-space: nowrap;
  padding: 4rpx 0;
}

.timeline-chip {
  display: inline-flex;
  align-items: center;
  padding: 16rpx 28rpx;
  margin-right: 16rpx;
  border-radius: 32rpx;
  background-color: #f5f5f5;
}

.chip-active {
  background: linear-gradient(135deg, $wedding-primary, $wedding-accent);
}

.chip-completed {
  background-color: rgba($wedding-primary, 0.1);
}

.chip-icon {
  font-size: 24rpx;
  margin-right: 8rpx;
}

.icon-check {
  color: #4caf50;
}

.icon-active {
  color: #ffffff;
  font-size: 20rpx;
}

.icon-default {
  color: transparent;
}

.chip-label {
  font-size: 24rpx;
  color: $wedding-text-light;
}

.chip-label-completed {
  color: #4caf50;
  font-weight: 600;
}

.chip-label-active {
  color: #ffffff;
  font-weight: 600;
}

// ── Task list ──────────────────────────────────────────────
.task-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.task-card {
  display: flex;
  align-items: flex-start;
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 24rpx;
  box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04);
}

.task-left {
  margin-right: 20rpx;
  padding-top: 4rpx;
}

.task-checkbox {
  width: 40rpx;
  height: 40rpx;
  border-radius: 20rpx;
  border: 3rpx solid #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #ffffff;
}

.task-checkbox-pending {
  border-color: #ccc;
  background-color: #ffffff;
}

.task-checkbox-checked {
  background-color: #4caf50;
  border-color: #4caf50;
}

.task-checkbox-progress {
  border-color: #2196F3;
  background-color: #E3F2FD;
}

.status-in-progress {
  font-size: 20rpx;
  color: #2196F3;
  background: #E3F2FD;
  padding: 2rpx 10rpx;
  border-radius: 8rpx;
}

.check-mark {
  color: #ffffff;
  font-size: 24rpx;
  font-weight: 700;
}

.task-body {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.task-name {
  font-size: 30rpx;
  color: $wedding-text;
  font-weight: 500;
  line-height: 1.4;
}

.task-name-done {
  text-decoration: line-through;
  color: $wedding-text-light;
}

.task-meta {
  display: flex;
  align-items: center;
  margin-top: 12rpx;
  gap: 16rpx;
}

.assignee-badge {
  padding: 4rpx 16rpx;
  border-radius: 12rpx;
}

.assignee-groom {
  background-color: rgba(25, 118, 210, 0.1);
}

.assignee-bride {
  background-color: rgba(233, 30, 99, 0.1);
}

.assignee-both {
  background-color: rgba(245, 124, 0, 0.1);
}

.assignee-text {
  font-size: 22rpx;
  font-weight: 600;
}

.assignee-groom .assignee-text {
  color: #1976d2;
}

.assignee-bride .assignee-text {
  color: #e91e63;
}

.assignee-both .assignee-text {
  color: #f57c00;
}

.task-deadline {
  font-size: 22rpx;
  color: $wedding-text-light;
}

.task-priority {
  font-size: 22rpx;
}

.task-stage-tag {
  font-size: 20rpx;
  color: $wedding-primary;
  background: rgba($wedding-primary, 0.1);
  padding: 2rpx 12rpx;
  border-radius: 8rpx;
}

.empty-hint {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 48rpx 24rpx;
  text-align: center;
}

.empty-hint-text {
  font-size: 26rpx;
  color: $wedding-text-light;
}

// ── Quick actions ──────────────────────────────────────────
.quick-actions {
  display: flex;
  justify-content: space-between;
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 36rpx 24rpx;
  box-shadow: 0 4rpx 24rpx rgba(0, 0, 0, 0.05);
}

.action-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.action-icon {
  width: 96rpx;
  height: 96rpx;
  border-radius: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 16rpx;
}

.action-icon-pink {
  background-color: rgba($wedding-primary, 0.15);
}

.action-icon-orange {
  background-color: rgba($wedding-accent, 0.15);
}

.action-icon-green {
  background-color: rgba(76, 175, 80, 0.15);
}

.action-icon-blue {
  background-color: rgba(33, 150, 243, 0.15);
}

.action-icon-text {
  font-size: 40rpx;
}

.action-label {
  font-size: 24rpx;
  color: $wedding-text;
  font-weight: 500;
}

// ── Bottom spacer ──────────────────────────────────────────
.bottom-spacer {
  height: calc(32rpx + env(safe-area-inset-bottom));
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

.confirm-btn-text-ok {
  font-size: 28rpx;
  color: #fff;
  font-weight: 600;
}
</style>
