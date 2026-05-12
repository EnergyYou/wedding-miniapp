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
import { ref, computed } from 'vue'

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

// ---------- Reactive State ----------

const expandedStageId = ref(3) // active stage expanded by default

const stages = ref<Stage[]>([
  {
    id: 1,
    name: '12个月前',
    status: 'completed',
    summaryText: '6项任务已完成',
    tagText: '已完成',
    tasks: [],
  },
  {
    id: 2,
    name: '6个月前',
    status: 'completed',
    summaryText: '4项任务已完成',
    tagText: '已完成',
    tasks: [],
  },
  {
    id: 3,
    name: '3个月前',
    status: 'active',
    summaryText: '进行中 \u00B7 2/6已完成',
    tagText: '当前阶段',
    tasks: [
      {
        id: 31,
        name: '确定伴郎伴娘',
        status: 'done',
        assignee: 'both',
        assigneeLabel: '共同',
        statusText: '\u2713 已完成',
        deadline: '',
        priority: false,
      },
      {
        id: 32,
        name: '试穿婚纱',
        status: 'done',
        assignee: 'bride',
        assigneeLabel: '新娘',
        statusText: '\u2713 已完成',
        deadline: '',
        priority: false,
      },
      {
        id: 33,
        name: '预定化妆师',
        status: 'in-progress',
        assignee: 'bride',
        assigneeLabel: '新娘',
        statusText: '进行中',
        deadline: '\uD83D\uDCC5 截止 8月15日',
        priority: true,
      },
      {
        id: 34,
        name: '发送请柬',
        status: 'pending',
        assignee: 'both',
        assigneeLabel: '共同',
        statusText: '待办',
        deadline: '\uD83D\uDCC5 截止 8月20日',
        priority: false,
      },
      {
        id: 35,
        name: '选购喜糖',
        status: 'pending',
        assignee: 'groom',
        assigneeLabel: '新郎',
        statusText: '待办',
        deadline: '\uD83D\uDCC5 截止 8月25日',
        priority: false,
      },
      {
        id: 36,
        name: '确认婚礼流程',
        status: 'pending',
        assignee: 'both',
        assigneeLabel: '共同',
        statusText: '待办',
        deadline: '\uD83D\uDCC5 截止 8月30日',
        priority: false,
      },
    ],
  },
  {
    id: 4,
    name: '1个月前',
    status: 'upcoming',
    summaryText: '5项任务',
    tagText: '未开始',
    tasks: [],
  },
  {
    id: 5,
    name: '1周前',
    status: 'upcoming',
    summaryText: '3项任务',
    tagText: '未开始',
    tasks: [],
  },
  {
    id: 6,
    name: '当天',
    status: 'upcoming',
    summaryText: '最重要的日子',
    tagText: '未开始',
    tasks: [],
  },
])

// ---------- Computed ----------

const completedCount = computed(() => {
  let count = 12 // mock: previous stages
  const activeStage = stages.value.find((s) => s.status === 'active')
  if (activeStage) {
    count += activeStage.tasks.filter((t) => t.status === 'done').length
  }
  return count
})

const totalCount = 24 // mock total

const progressPercent = computed(() => {
  return Math.round((completedCount.value / totalCount) * 100)
})

// ---------- Methods ----------

function toggleStage(stage: Stage): void {
  if (stage.status !== 'active') {
    return
  }
  expandedStageId.value = expandedStageId.value === stage.id ? -1 : stage.id
}

function toggleTask(stage: Stage, task: Task): void {
  const stageRef = stages.value.find((s) => s.id === stage.id)
  if (!stageRef) {
    return
  }
  const taskRef = stageRef.tasks.find((t) => t.id === task.id)
  if (!taskRef) {
    return
  }

  if (taskRef.status === 'done') {
    taskRef.status = 'pending'
    taskRef.statusText = '待办'
  } else {
    taskRef.status = 'done'
    taskRef.statusText = '\u2713 已完成'
  }

  // Update stage summary
  const doneCount = stageRef.tasks.filter((t) => t.status === 'done').length
  const totalTasks = stageRef.tasks.length
  stageRef.summaryText = `\u8FDB\u884C\u4E2D \u00B7 ${doneCount}/${totalTasks}\u5DF2\u5B8C\u6210`
}

function onFabTap(): void {
  uni.showToast({ title: '添加任务（开发中）', icon: 'none' })
}
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
