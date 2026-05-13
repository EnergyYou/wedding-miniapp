<template>
  <view class="page">

    <!-- Progress Summary Bar -->
    <view class="progress-summary">
      <view class="progress-info">
        <text class="progress-label">当前阶段: 婚礼前3个月</text>
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
            <text v-if="stage.status === 'completed'" class="node-check">&#10003;</text>
            <text v-else-if="stage.status === 'active'" class="node-dot">&#9679;</text>
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

          <!-- Task list (only for active stage) -->
          <view v-if="stage.status === 'active' && expandedStageId === stage.id" class="task-list">
            <view
              v-for="task in stage.tasks"
              :key="task.id"
              :class="['task-card', task.status, 'assignee-' + task.assignee]"
              @tap="toggleTask(stage, task)"
            >
              <!-- Checkbox -->
              <view :class="['task-checkbox', task.status]">
                <text v-if="task.status === 'done'" class="checkbox-icon">&#10003;</text>
              </view>

              <!-- Task content -->
              <view class="task-content">
                <view class="task-title-row">
                  <text :class="['task-title', task.status]">{{ task.name }}</text>
                  <text v-if="task.priority" class="priority-star">&#9733;</text>
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

  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getTimelineList } from '@/api/timeline'
import { getTaskList, getTaskStats, updateTaskStatus } from '@/api/task'

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
const completedCount = ref(0)
const totalCount = ref(0)

const progressPercent = computed(() => {
  if (totalCount.value === 0) {
    return 0
  }
  return Math.round((completedCount.value / totalCount.value) * 100)
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
  if (stage.status !== 'active') {
    return
  }
  expandedStageId.value = expandedStageId.value === stage.id ? -1 : stage.id
}

async function toggleTask(stage: Stage, task: Task): Promise<void> {
  const newApiStatus = task.status === 'done' ? 0 : 2

  try {
    await updateTaskStatus(task.id, newApiStatus)
    await loadData()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '操作失败'
    uni.showToast({ title: message, icon: 'none' })
  }
}

function onFabTap(): void {
  uni.showToast({ title: '添加任务（开发中）', icon: 'none' })
}

// ---------- Lifecycle ----------

onMounted(() => {
  loadData()
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

</style>
