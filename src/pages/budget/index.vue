<template>
  <view class="page">
    <!-- Custom Header -->
    <view class="header" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="header-content">
        <text class="header-title">预算管理</text>
        <text class="header-subtitle">
          总预算 ¥{{ formatAmount(totalBudget) }} · 已用 {{ usedPercentage }}%
        </text>
      </view>
    </view>

    <!-- Scrollable Body -->
    <scroll-view class="body" scroll-y enhanced :show-scrollbar="false">
      <!-- Ring Chart Card -->
      <view class="chart-card">
        <view class="ring-wrapper">
          <view class="ring-chart" :style="ringChartStyle">
            <view class="ring-inner">
              <text class="ring-percent">{{ usedPercentage }}%</text>
              <text class="ring-label">已使用</text>
            </view>
          </view>
        </view>
        <view class="chart-stats">
          <view class="chart-stat-row">
            <text class="chart-stat-label">总预算</text>
            <text class="chart-stat-value">¥{{ formatAmount(totalBudget) }}</text>
          </view>
          <view class="chart-stat-row">
            <text class="chart-stat-label">已支出</text>
            <text class="chart-stat-value expense">¥{{ formatAmount(totalExpense) }}</text>
          </view>
          <view class="chart-stat-row">
            <text class="chart-stat-label">剩余</text>
            <text class="chart-stat-value remaining">¥{{ formatAmount(totalRemaining) }}</text>
          </view>
        </view>
      </view>

      <!-- Quick Stats Row -->
      <view class="quick-stats">
        <view class="quick-stat-card">
          <view class="quick-stat-icon gold">
            <text class="icon-text">💰</text>
          </view>
          <text class="quick-stat-label">总预算</text>
          <text class="quick-stat-amount">¥{{ formatAmount(totalBudget) }}</text>
        </view>
        <view class="quick-stat-card">
          <view class="quick-stat-icon pink">
            <text class="icon-text">📊</text>
          </view>
          <text class="quick-stat-label">已支出</text>
          <text class="quick-stat-amount">¥{{ formatAmount(totalExpense) }}</text>
        </view>
        <view class="quick-stat-card">
          <view class="quick-stat-icon green">
            <text class="icon-text">💡</text>
          </view>
          <text class="quick-stat-label">剩余</text>
          <text class="quick-stat-amount">¥{{ formatAmount(totalRemaining) }}</text>
        </view>
      </view>

      <!-- Category List -->
      <view class="section-title">
        <text class="section-title-text">预算分类</text>
      </view>

      <view
        v-for="cat in categoryList"
        :key="cat.name"
        class="category-card"
        :class="{ 'over-budget': cat.isOverBudget }"
        @tap="onCategoryTap(cat)"
      >
        <view class="cat-left">
          <view class="cat-icon" :style="{ backgroundColor: cat.color }">
            <text class="cat-icon-text">{{ cat.icon }}</text>
          </view>
        </view>
        <view class="cat-center">
          <view class="cat-name-row">
            <text class="cat-name">{{ cat.name }}</text>
            <view class="cat-badge" :class="cat.badgeLevel">
              <text class="cat-badge-text">{{ cat.percentText }}</text>
            </view>
          </view>
          <text class="cat-amount">
            ¥{{ formatAmount(cat.actual) }} / ¥{{ formatAmount(cat.planned) }}
          </text>
          <view class="progress-track">
            <view
              class="progress-fill"
              :style="{
                width: cat.progressWidth,
                background: cat.progressGradient
              }"
            />
          </view>
          <text v-if="cat.isOverBudget" class="over-budget-text">
            超支 ¥{{ formatAmount(cat.actual - cat.planned) }}
          </text>
        </view>
      </view>

      <!-- Bottom spacer for fixed button + tab bar -->
      <view class="bottom-spacer" />
    </scroll-view>

    <!-- Fixed Add Expense Button -->
    <view class="fixed-bottom">
      <button class="add-expense-btn" @tap="onAddExpense">
        <text class="add-expense-btn-text">+ 新增预算分类</text>
      </button>
    </view>

    <!-- Budget Form Popup -->
    <view v-if="showForm" class="popup-mask" @tap="showForm = false">
      <view class="popup-content" @tap.stop>
        <view class="popup-header">
          <text class="popup-title">{{ editingBudget ? '编辑预算' : '新增预算' }}</text>
          <text class="popup-close" @tap="showForm = false">✕</text>
        </view>
        <view class="form-group">
          <text class="form-label">分类名称 *</text>
          <input v-model="formData.category" class="form-input" placeholder="如：婚宴酒店" />
        </view>
        <view class="form-group">
          <text class="form-label">预算金额 (元) *</text>
          <input v-model="formData.plannedAmount" class="form-input" type="digit" placeholder="0.00" />
        </view>
        <view class="form-group">
          <text class="form-label">实际支出 (元)</text>
          <input v-model="formData.actualAmount" class="form-input" type="digit" placeholder="0.00" />
        </view>
        <view class="form-group">
          <text class="form-label">备注</text>
          <input v-model="formData.remark" class="form-input" placeholder="选填" />
        </view>
        <view class="form-actions">
          <button v-if="editingBudget" class="form-btn form-btn-delete" @tap="handleDeleteBudget">删除</button>
          <button class="form-btn form-btn-cancel" @tap="showForm = false">取消</button>
          <button class="form-btn form-btn-submit" @tap="handleSubmit">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getBudgetList, getBudgetSummary, createBudget, updateBudget, deleteBudget } from '../../api/budget'
import type { Budget, BudgetSummary } from '../../api/budget'

// ---------- Status bar height ----------
const statusBarHeight = ref(44)

// ---------- Types ----------
interface RawCategory {
  name: string
  icon: string
  color: string
  actual: number
  planned: number
}

interface CategoryViewModel extends RawCategory {
  percent: number
  percentText: string
  progressWidth: string
  progressGradient: string
  badgeLevel: 'normal' | 'warning' | 'danger'
  isOverBudget: boolean
}

// ---------- Color palette for categories ----------
const catColors = [
  '#E8A0BF', '#D4A574', '#B5838D', '#C9B1FF', '#FFB4A2', '#A8DADC',
  '#F4A261', '#E76F51', '#2A9D8F', '#264653', '#E9C46A', '#606C38',
]

const catIcons: Record<string, string> = {
  '婚宴酒店': '🏨',
  '婚纱摄影': '📷',
  '婚庆策划': '🎪',
  '婚纱礼服': '👗',
  '婚礼用品': '🎀',
  '其他': '📦',
}

// ---------- Data from API ----------
const budgetList = ref<Budget[]>([])
const summary = ref<BudgetSummary | null>(null)

const rawCategories = computed<RawCategory[]>(() =>
  budgetList.value.map((b, idx) => ({
    name: b.category,
    icon: catIcons[b.category] || '💰',
    color: catColors[idx % catColors.length],
    actual: parseFloat(b.actualAmount) || 0,
    planned: parseFloat(b.plannedAmount) || 0,
  }))
)

// ---------- Enriched category list ----------
const categoryList = computed<CategoryViewModel[]>(() =>
  rawCategories.value.map((cat) => {
    const percent = cat.planned > 0 ? (cat.actual / cat.planned) * 100 : 0
    const isOverBudget = cat.actual > cat.planned
    const clampedWidth = Math.min(percent, 100)

    let badgeLevel: 'normal' | 'warning' | 'danger' = 'normal'
    if (percent > 100) badgeLevel = 'danger'
    else if (percent > 80) badgeLevel = 'warning'

    return {
      ...cat,
      percent,
      percentText: `${Math.round(percent)}%`,
      progressWidth: `${clampedWidth}%`,
      progressGradient: isOverBudget
        ? 'linear-gradient(90deg, #E8A0BF, #FF4D4F)'
        : 'linear-gradient(90deg, #E8A0BF, #D4A574)',
      badgeLevel,
      isOverBudget
    }
  })
)

// ---------- Computed totals ----------
const totalBudget = computed(() =>
  summary.value ? parseFloat(summary.value.totalPlanned) || 0
    : rawCategories.value.reduce((sum, c) => sum + c.planned, 0)
)

const totalExpense = computed(() =>
  summary.value ? parseFloat(summary.value.totalActual) || 0
    : rawCategories.value.reduce((sum, c) => sum + c.actual, 0)
)

const totalRemaining = computed(() =>
  Math.max(totalBudget.value - totalExpense.value, 0)
)

const usedPercentage = computed(() => {
  if (totalBudget.value === 0) return '0.0'
  const pct = (totalExpense.value / totalBudget.value) * 100
  return pct.toFixed(1)
})

// ---------- Ring chart conic-gradient ----------
const ringChartStyle = computed(() => {
  const pct = parseFloat(usedPercentage.value)
  const clamped = Math.min(pct, 100)
  const usedDeg = clamped * 3.6
  return {
    background: `conic-gradient(#E8A0BF 0deg, #D4A574 ${usedDeg}deg, #F0E0E8 ${usedDeg}deg, #F0E0E8 360deg)`
  }
})

// ---------- Helpers ----------
function formatAmount(value: number): string {
  return value.toLocaleString('zh-CN')
}

function onCategoryTap(cat: CategoryViewModel) {
  const budget = budgetList.value.find(b => b.category === cat.name)
  if (!budget) return
  editingBudget.value = budget
  formData.value = {
    category: budget.category,
    plannedAmount: budget.plannedAmount,
    actualAmount: budget.actualAmount,
    remark: budget.remark || '',
  }
  showForm.value = true
}

function onAddExpense() {
  editingBudget.value = null
  formData.value = { category: '', plannedAmount: '', actualAmount: '', remark: '' }
  showForm.value = true
}

// ---------- Form ----------
const showForm = ref(false)
const editingBudget = ref<Budget | null>(null)
const formData = ref({ category: '', plannedAmount: '', actualAmount: '', remark: '' })

async function handleSubmit() {
  const d = formData.value

  // 分类名称校验：必填，2-20字
  const category = d.category.trim()
  if (!category) {
    uni.showToast({ title: '请输入分类名称', icon: 'none' })
    return
  }
  if (category.length > 20) {
    uni.showToast({ title: '分类名称最多20个字', icon: 'none' })
    return
  }

  // 预算金额校验：必填，正数，最多2位小数，上限999999
  if (!d.plannedAmount) {
    uni.showToast({ title: '请输入预算金额', icon: 'none' })
    return
  }
  const planned = parseFloat(d.plannedAmount)
  if (isNaN(planned) || planned <= 0) {
    uni.showToast({ title: '预算金额必须为正数', icon: 'none' })
    return
  }
  if (planned > 999999) {
    uni.showToast({ title: '预算金额不能超过999999', icon: 'none' })
    return
  }
  if (!/^\d+(\.\d{1,2})?$/.test(String(d.plannedAmount))) {
    uni.showToast({ title: '预算金额最多2位小数', icon: 'none' })
    return
  }

  // 实际支出校验：非必填，正数，最多2位小数
  if (d.actualAmount && d.actualAmount.trim()) {
    const actual = parseFloat(d.actualAmount)
    if (isNaN(actual) || actual < 0) {
      uni.showToast({ title: '实际支出必须为非负数', icon: 'none' })
      return
    }
    if (actual > 999999) {
      uni.showToast({ title: '实际支出不能超过999999', icon: 'none' })
      return
    }
    if (!/^\d+(\.\d{1,2})?$/.test(d.actualAmount.trim())) {
      uni.showToast({ title: '实际支出最多2位小数', icon: 'none' })
      return
    }
  }

  // 备注校验：非必填，最多100字
  if (d.remark && d.remark.length > 100) {
    uni.showToast({ title: '备注最多100个字', icon: 'none' })
    return
  }

  try {
    if (editingBudget.value) {
      await updateBudget({
        id: editingBudget.value.id,
        category: d.category,
        plannedAmount: d.plannedAmount,
        actualAmount: d.actualAmount || '0',
        remark: d.remark || undefined,
      })
    } else {
      await createBudget({
        category: d.category,
        plannedAmount: d.plannedAmount,
        actualAmount: d.actualAmount || '0',
        remark: d.remark || undefined,
      })
    }
    showForm.value = false
    uni.showToast({ title: '保存成功', icon: 'success' })
    await fetchBudgetData()
  } catch {
    // error handled by request wrapper
  }
}

async function handleDeleteBudget() {
  if (!editingBudget.value) return
  uni.showModal({
    title: '确认删除',
    content: `确定要删除"${editingBudget.value.category}"的预算吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteBudget(editingBudget.value!.id)
          showForm.value = false
          uni.showToast({ title: '已删除', icon: 'success' })
          await fetchBudgetData()
        } catch {
          // error handled by request wrapper
        }
      }
    },
  })
}

// ---------- API fetch ----------
async function fetchBudgetData() {
  try {
    const [listResult, summaryResult] = await Promise.all([
      getBudgetList(),
      getBudgetSummary(),
    ])
    budgetList.value = listResult ?? []
    summary.value = summaryResult ?? null
  } catch {
    uni.showToast({ title: '获取预算数据失败', icon: 'none' })
  }
}

onMounted(() => {
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight ?? 44
  fetchBudgetData()
})
</script>

<style lang="scss" scoped>
/* ---------- Page ---------- */
.page {
  min-height: 100vh;
  background-color: $wedding-bg;
  display: flex;
  flex-direction: column;
}

/* ---------- Header ---------- */
.header {
  background: linear-gradient(135deg, #E8A0BF, #D4A574);
  padding-bottom: 48rpx;
  border-radius: 0 0 48rpx 48rpx;
}

.header-content {
  padding: 24rpx 40rpx 0;
}

.header-title {
  font-size: 44rpx;
  font-weight: 700;
  color: #ffffff;
}

.header-subtitle {
  font-size: 26rpx;
  color: rgba(255, 255, 255, 0.85);
  margin-top: 8rpx;
}

/* ---------- Body ---------- */
.body {
  flex: 1;
  padding: 24rpx 24rpx 0;
}

/* ---------- Ring Chart Card ---------- */
.chart-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx 32rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4rpx 24rpx rgba(232, 160, 191, 0.12);
}

.ring-wrapper {
  margin-bottom: 32rpx;
}

.ring-chart {
  width: 240rpx;
  height: 240rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ring-inner {
  width: 170rpx;
  height: 170rpx;
  border-radius: 50%;
  background: #ffffff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ring-percent {
  font-size: 44rpx;
  font-weight: 700;
  color: $wedding-text;
  line-height: 1.2;
}

.ring-label {
  font-size: 24rpx;
  color: $wedding-text-light;
  margin-top: 4rpx;
}

.chart-stats {
  width: 100%;
}

.chart-stat-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14rpx 0;
  border-bottom: 1rpx solid #F5F0F2;

  &:last-child {
    border-bottom: none;
  }
}

.chart-stat-label {
  font-size: 28rpx;
  color: $wedding-text-light;
}

.chart-stat-value {
  font-size: 28rpx;
  font-weight: 600;
  color: $wedding-text;

  &.expense {
    color: #E8A0BF;
  }

  &.remaining {
    color: #52C41A;
  }
}

/* ---------- Quick Stats ---------- */
.quick-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 24rpx;
  gap: 16rpx;
}

.quick-stat-card {
  flex: 1;
  background: #ffffff;
  border-radius: 20rpx;
  padding: 24rpx 16rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 4rpx 16rpx rgba(232, 160, 191, 0.08);
}

.quick-stat-icon {
  width: 64rpx;
  height: 64rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12rpx;

  &.gold {
    background: rgba(212, 165, 116, 0.15);
  }

  &.pink {
    background: rgba(232, 160, 191, 0.15);
  }

  &.green {
    background: rgba(82, 196, 26, 0.15);
  }
}

.icon-text {
  font-size: 32rpx;
}

.quick-stat-label {
  font-size: 22rpx;
  color: $wedding-text-light;
  margin-bottom: 6rpx;
}

.quick-stat-amount {
  font-size: 24rpx;
  font-weight: 700;
  color: $wedding-text;
}

/* ---------- Section Title ---------- */
.section-title {
  margin: 32rpx 0 16rpx 8rpx;
}

.section-title-text {
  font-size: 32rpx;
  font-weight: 700;
  color: $wedding-text;
}

/* ---------- Category Card ---------- */
.category-card {
  background: #ffffff;
  border-radius: 20rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 20rpx;
  display: flex;
  align-items: flex-start;
  box-shadow: 0 4rpx 16rpx rgba(232, 160, 191, 0.08);

  &.over-budget {
    border-left: 6rpx solid #FF4D4F;
  }
}

.cat-left {
  margin-right: 20rpx;
  flex-shrink: 0;
}

.cat-icon {
  width: 72rpx;
  height: 72rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cat-icon-text {
  font-size: 32rpx;
}

.cat-center {
  flex: 1;
  min-width: 0;
}

.cat-name-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8rpx;
}

.cat-name {
  font-size: 30rpx;
  font-weight: 600;
  color: $wedding-text;
}

.cat-badge {
  padding: 4rpx 16rpx;
  border-radius: 20rpx;

  &.normal {
    background: rgba(232, 160, 191, 0.15);
  }

  &.warning {
    background: rgba(250, 204, 21, 0.2);
  }

  &.danger {
    background: rgba(255, 77, 79, 0.15);
  }
}

.cat-badge-text {
  font-size: 22rpx;
  font-weight: 600;
}

.cat-badge.normal .cat-badge-text {
  color: #E8A0BF;
}

.cat-badge.warning .cat-badge-text {
  color: #D4A017;
}

.cat-badge.danger .cat-badge-text {
  color: #FF4D4F;
}

.cat-amount {
  font-size: 24rpx;
  color: $wedding-text-light;
  margin-bottom: 12rpx;
}

.progress-track {
  width: 100%;
  height: 12rpx;
  background: #F0E0E8;
  border-radius: 6rpx;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 6rpx;
  transition: width 0.3s ease;
}

.over-budget-text {
  font-size: 22rpx;
  color: #FF4D4F;
  font-weight: 600;
  margin-top: 8rpx;
}

/* ---------- Bottom Spacer ---------- */
.bottom-spacer {
  height: 180rpx;
}

/* ---------- Fixed Bottom Button ---------- */
.fixed-bottom {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(var(--window-bottom) + 16rpx);
  padding: 0 32rpx;
  z-index: 100;
}

.add-expense-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(135deg, #E8A0BF, #D4A574);
  border-radius: 44rpx;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 32rpx rgba(232, 160, 191, 0.35);

  &::after {
    border: none;
  }
}

.add-expense-btn-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #ffffff;
}

/* ---------- Popup Form ---------- */
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
  justify-content: center;
}

.popup-content {
  width: 100%;
  background: #ffffff;
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

.form-btn::after { border: none; }

.form-btn-cancel {
  background: #F0F0F0;
  color: #666;
}

.form-btn-submit {
  background: linear-gradient(135deg, $wedding-primary, $wedding-accent);
  color: #ffffff;
}

.form-btn-delete {
  background: #FFF1F0;
  color: #FF4D4F;
}
</style>
