<template>
  <view class="mine-page">
    <!-- 头部区域 -->
    <view class="header">
      <view class="header-bg" />
      <view class="user-info" @tap="handleAvatarTap">
        <view class="avatar-wrapper">
          <image
            v-if="userStore.avatar"
            class="avatar"
            :src="userStore.avatar"
            mode="aspectFill"
          />
          <view v-else class="avatar-placeholder">
            <text class="avatar-icon">&#x1F464;</text>
          </view>
        </view>
        <view class="user-detail">
          <text class="nickname">
            {{ isLoggedIn ? (userStore.nickName || '新用户') : '点击登录' }}
          </text>
          <view v-if="isLoggedIn" class="bind-status">
            <text class="bind-tag" :class="isBound ? 'bound' : 'unbound'">
              {{ isBound ? '已绑定' : '未绑定' }}
            </text>
          </view>
        </view>
      </view>
    </view>

    <!-- 信息卡片 -->
    <view class="info-card">
      <view class="info-item">
        <text class="info-label">婚期</text>
        <text class="info-value">
          {{ weddingDate ? formatDate(weddingDate) : '未设置' }}
        </text>
      </view>
      <view class="info-divider" />
      <view class="info-item">
        <text class="info-label">倒计时</text>
        <text class="info-value countdown">
          {{ daysUntilWedding !== null ? `${daysUntilWedding} 天` : '未设置' }}
        </text>
      </view>
      <view class="info-divider" />
      <view class="info-item">
        <text class="info-label">伴侣</text>
        <text class="info-value">
          {{ isBound ? (coupleStore.partnerName || '已绑定') : '未绑定' }}
        </text>
      </view>
    </view>

    <!-- 菜单列表 -->
    <view class="menu-card">
      <view class="menu-item" @tap="handleSetDate">
        <text class="menu-text">设置婚期</text>
        <text class="menu-arrow">&#x276F;</text>
      </view>
      <view class="menu-divider" />
      <view class="menu-item" @tap="handleGoCouple">
        <text class="menu-text">情侣管理</text>
        <text class="menu-arrow">&#x276F;</text>
      </view>
      <view class="menu-divider" />
      <view class="menu-item" @tap="handleAbout">
        <text class="menu-text">关于我们</text>
        <text class="menu-arrow">&#x276F;</text>
      </view>
    </view>

    <!-- 退出登录 -->
    <view v-if="isLoggedIn" class="logout-card">
      <view class="logout-btn" @tap="handleLogout">
        <text class="logout-text">退出登录</text>
      </view>
    </view>

    <!-- 日期选择器弹窗 -->
    <view v-if="showDatePicker" class="picker-mask" @tap="showDatePicker = false">
      <view class="picker-container" @tap.stop>
        <view class="picker-header">
          <text class="picker-cancel" @tap="showDatePicker = false">取消</text>
          <text class="picker-title">选择婚期</text>
          <text class="picker-confirm" @tap="handleConfirmDate">确定</text>
        </view>
        <picker-view
          class="picker-view"
          :value="pickerValue"
          @change="onPickerChange"
        >
          <picker-view-column>
            <view v-for="year in years" :key="year" class="picker-item">
              {{ year }}年
            </view>
          </picker-view-column>
          <picker-view-column>
            <view v-for="month in months" :key="month" class="picker-item">
              {{ month }}月
            </view>
          </picker-view-column>
          <picker-view-column>
            <view v-for="day in days" :key="day" class="picker-item">
              {{ day }}日
            </view>
          </picker-view-column>
        </picker-view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'
import { useCoupleStore } from '@/store/couple'
import { logout } from '@/api/user'
import { updateWeddingDate } from '@/api/couple'
import { silentLogin } from '@/utils/auth'

const userStore = useUserStore()
const coupleStore = useCoupleStore()

const showDatePicker = ref(false)

const isLoggedIn = computed(() => !!userStore.token)
const isBound = computed(() => coupleStore.isBound)
const weddingDate = computed(() => coupleStore.weddingDate)

const daysUntilWedding = computed(() => {
  if (!weddingDate.value) return null
  const target = new Date(weddingDate.value).getTime()
  const now = Date.now()
  const diff = target - now
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
})

// Date picker data
const currentYear = new Date().getFullYear()
const years = Array.from({ length: 10 }, (_, i) => currentYear + i)
const months = Array.from({ length: 12 }, (_, i) => i + 1)

const pickerValue = ref([0, 0, 0])
const selectedDate = ref({ year: currentYear, month: 1, day: 1 })

const days = computed(() => {
  const { year, month } = selectedDate.value
  const maxDay = new Date(year, month, 0).getDate()
  return Array.from({ length: maxDay }, (_, i) => i + 1)
})

function onPickerChange(e: { detail: { value: number[] } }) {
  const [yearIdx, monthIdx, dayIdx] = e.detail.value
  const year = years[yearIdx] || currentYear
  const month = (monthIdx || 0) + 1
  const day = (dayIdx || 0) + 1
  selectedDate.value = { year, month, day }
  pickerValue.value = [yearIdx, monthIdx, dayIdx]
}

function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

onShow(async () => {
  if (!userStore.token) {
    await silentLogin()
  }
})

function handleAvatarTap() {
  if (!isLoggedIn.value) {
    silentLogin()
  }
}

function handleSetDate() {
  if (!isLoggedIn.value) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    silentLogin()
    return
  }
  if (!isBound.value) {
    uni.showToast({ title: '请先绑定情侣', icon: 'none' })
    return
  }

  // Initialize picker to current wedding date or today
  const now = new Date()
  let initYear = now.getFullYear()
  let initMonth = now.getMonth()
  let initDay = now.getDate() - 1

  if (weddingDate.value) {
    const wd = new Date(weddingDate.value)
    const yearIdx = years.indexOf(wd.getFullYear())
    if (yearIdx >= 0) {
      initYear = yearIdx
    }
    initMonth = wd.getMonth()
    initDay = wd.getDate() - 1
  }

  pickerValue.value = [years.indexOf(initYear) >= 0 ? years.indexOf(initYear) : 0, initMonth, initDay]
  selectedDate.value = {
    year: years[pickerValue.value[0]] || currentYear,
    month: pickerValue.value[1] + 1,
    day: pickerValue.value[2] + 1,
  }
  showDatePicker.value = true
}

async function handleConfirmDate() {
  showDatePicker.value = false
  const { year, month, day } = selectedDate.value
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  try {
    uni.showLoading({ title: '保存中...' })
    await updateWeddingDate(dateStr)
    coupleStore.setCoupleInfo({
      coupleId: coupleStore.coupleId,
      weddingDate: dateStr,
      partnerName: coupleStore.partnerName,
    })
    uni.showToast({ title: '婚期设置成功', icon: 'success' })
  } catch (error) {
    uni.showToast({ title: '设置失败，请重试', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

function handleGoCouple() {
  uni.navigateTo({ url: '/pages/couple/index' })
}

function handleAbout() {
  uni.showModal({
    title: '关于我们',
    content: '备婚小助手 - 让婚礼筹备更轻松',
    showCancel: false,
    confirmText: '知道了',
  })
}

async function handleLogout() {
  const res = await new Promise<boolean>((resolve) => {
    uni.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      success: (result) => resolve(result.confirm),
    })
  })

  if (!res) return

  try {
    await logout()
  } catch (_e) {
    // Ignore logout API errors, proceed with local cleanup
  }

  userStore.clearToken()
  coupleStore.clearCouple()
  uni.reLaunch({ url: '/pages/index/index' })
}
</script>

<style lang="scss" scoped>
.mine-page {
  min-height: 100vh;
  background-color: $wedding-bg;
  padding-bottom: 40rpx;
}

/* Header */
.header {
  position: relative;
  padding-top: 60rpx;
  padding-bottom: 80rpx;
}

.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, $wedding-primary 0%, #f0c0d8 100%);
  border-radius: 0 0 40rpx 40rpx;
}

.user-info {
  position: relative;
  display: flex;
  align-items: center;
  padding: 40rpx;
}

.avatar-wrapper {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  overflow: hidden;
  border: 4rpx solid rgba(255, 255, 255, 0.8);
  flex-shrink: 0;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
}

.avatar-placeholder {
  width: 120rpx;
  height: 120rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.5);
}

.avatar-icon {
  font-size: 60rpx;
}

.user-detail {
  margin-left: 30rpx;
  display: flex;
  flex-direction: column;
}

.nickname {
  font-size: 36rpx;
  font-weight: bold;
  color: #ffffff;
}

.bind-status {
  margin-top: 10rpx;
}

.bind-tag {
  display: inline-block;
  font-size: 22rpx;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.bind-tag.bound {
  background-color: rgba(255, 255, 255, 0.3);
  color: #ffffff;
}

.bind-tag.unbound {
  background-color: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.8);
}

/* Info Card */
.info-card {
  margin: -40rpx 30rpx 30rpx;
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 40rpx;
  display: flex;
  align-items: center;
  position: relative;
  z-index: 1;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.info-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.info-label {
  font-size: 24rpx;
  color: $wedding-text-light;
  margin-bottom: 12rpx;
}

.info-value {
  font-size: 28rpx;
  color: $wedding-text;
  font-weight: 500;
}

.info-value.countdown {
  color: $wedding-primary;
  font-size: 32rpx;
  font-weight: bold;
}

.info-divider {
  width: 1rpx;
  height: 60rpx;
  background-color: #f0f0f0;
}

/* Menu Card */
.menu-card {
  margin: 0 30rpx 30rpx;
  background-color: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.menu-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 36rpx 40rpx;
}

.menu-item:active {
  background-color: #f9f9f9;
}

.menu-text {
  font-size: 30rpx;
  color: $wedding-text;
}

.menu-arrow {
  font-size: 24rpx;
  color: $wedding-text-light;
}

.menu-divider {
  height: 1rpx;
  background-color: #f5f5f5;
  margin-left: 40rpx;
}

/* Logout */
.logout-card {
  margin: 40rpx 30rpx 0;
}

.logout-btn {
  background-color: #ffffff;
  border-radius: 24rpx;
  padding: 30rpx;
  text-align: center;
  box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
}

.logout-btn:active {
  background-color: #f9f9f9;
}

.logout-text {
  font-size: 30rpx;
  color: #e74c3c;
}

/* Date Picker */
.picker-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}

.picker-container {
  width: 100%;
  background-color: #ffffff;
  border-radius: 24rpx 24rpx 0 0;
  padding-bottom: env(safe-area-inset-bottom);
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx 40rpx;
  border-bottom: 1rpx solid #f0f0f0;
}

.picker-cancel {
  font-size: 30rpx;
  color: $wedding-text-light;
}

.picker-title {
  font-size: 32rpx;
  font-weight: bold;
  color: $wedding-text;
}

.picker-confirm {
  font-size: 30rpx;
  color: $wedding-primary;
  font-weight: 500;
}

.picker-view {
  width: 100%;
  height: 400rpx;
}

.picker-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80rpx;
  font-size: 30rpx;
  color: $wedding-text;
}
</style>
