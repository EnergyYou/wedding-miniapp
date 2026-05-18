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
            :src="avatarUrl"
            mode="aspectFill"
          />
          <view v-else class="avatar-placeholder">
            <text class="avatar-icon">&#x1F464;</text>
          </view>
          <view v-if="isLoggedIn" class="avatar-edit-badge">
            <text class="edit-badge-text">&#x270E;</text>
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
      <view class="info-item" @tap="handleShowDateDetail">
        <text class="info-label">婚期</text>
        <text class="info-value" :class="{ clickable: !!weddingDate }">
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
      <view class="info-item" @tap="handleShowPartner">
        <text class="info-label">伴侣</text>
        <text class="info-value" :class="{ clickable: isBound }">
          {{ isBound ? (coupleStore.partnerName || '已绑定') : '未绑定' }}
        </text>
      </view>
    </view>

    <!-- 菜单列表 -->
    <view class="menu-card">
      <view class="menu-item" @tap="handleEditProfile">
        <text class="menu-text">个人信息</text>
        <text class="menu-arrow">&#x276F;</text>
      </view>
      <view class="menu-divider" />
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

    <!-- 个人信息编辑弹窗 -->
    <view v-if="showProfileForm" class="popup-mask" @tap="showProfileForm = false">
      <view class="popup-content" @tap.stop>
        <view class="popup-header">
          <text class="popup-title">个人信息</text>
          <text class="popup-close" @tap="showProfileForm = false">&times;</text>
        </view>

        <!-- 头像 -->
        <view class="form-group">
          <text class="form-label">头像</text>
          <view class="current-avatar-row" @tap="showAvatarPicker = true">
            <image v-if="profileForm.avatar" class="current-avatar" :src="resolveAvatarUrl(profileForm.avatar)" mode="aspectFill" />
            <view v-else class="current-avatar avatar-placeholder-small">
              <text class="avatar-icon-small">&#x1F464;</text>
            </view>
            <text class="change-avatar-text">点击更换头像</text>
          </view>
        </view>

        <!-- 昵称 -->
        <view class="form-group">
          <text class="form-label">昵称</text>
          <input v-model="profileForm.nickName" class="form-input" placeholder="请输入昵称" maxlength="20" />
        </view>

        <!-- 性别 -->
        <view class="form-group">
          <text class="form-label">性别</text>
          <view class="form-picker">
            <view class="form-picker-item" :class="{ active: profileForm.sex === '0' }" @tap="profileForm.sex = '0'">
              <text>男</text>
            </view>
            <view class="form-picker-item" :class="{ active: profileForm.sex === '1' }" @tap="profileForm.sex = '1'">
              <text>女</text>
            </view>
            <view class="form-picker-item" :class="{ active: profileForm.sex === '2' || !profileForm.sex }" @tap="profileForm.sex = '2'">
              <text>未设置</text>
            </view>
          </view>
        </view>

        <!-- 手机号 -->
        <view class="form-group">
          <text class="form-label">手机号</text>
          <input v-model="profileForm.phonenumber" class="form-input" placeholder="请输入手机号" type="number" maxlength="11" />
        </view>

        <view class="form-actions">
          <button class="form-btn form-btn-cancel" @tap="showProfileForm = false">取消</button>
          <button class="form-btn form-btn-submit" @tap="handleSaveProfile">保存</button>
        </view>
      </view>
    </view>

    <!-- 头像选择弹窗 -->
    <view v-if="showAvatarPicker" class="popup-mask" @tap="showAvatarPicker = false">
      <view class="popup-content" @tap.stop>
        <view class="popup-header">
          <text class="popup-title">选择头像</text>
          <text class="popup-close" @tap="showAvatarPicker = false">&times;</text>
        </view>

        <!-- 新郎头像 -->
        <view class="avatar-section">
          <text class="avatar-section-title">新郎头像</text>
          <view class="avatar-grid">
            <view
              v-for="i in 10"
              :key="'groom_' + i"
              class="avatar-grid-item"
              :class="{ selected: profileForm.avatar === ('/static/avatars/groom_' + i + '.webp') }"
              @tap="selectAvatar('/static/avatars/groom_' + i + '.webp')"
            >
              <image class="avatar-grid-img" :src="'/static/avatars/groom_' + i + '.webp'" mode="aspectFill" />
            </view>
          </view>
        </view>

        <!-- 新娘头像 -->
        <view class="avatar-section">
          <text class="avatar-section-title">新娘头像</text>
          <view class="avatar-grid">
            <view
              v-for="i in 10"
              :key="'bride_' + i"
              class="avatar-grid-item"
              :class="{ selected: profileForm.avatar === ('/static/avatars/bride_' + i + '.webp') }"
              @tap="selectAvatar('/static/avatars/bride_' + i + '.webp')"
            >
              <image class="avatar-grid-img" :src="'/static/avatars/bride_' + i + '.webp'" mode="aspectFill" />
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 伴侣信息弹窗 -->
    <view v-if="showPartnerInfo" class="popup-mask" @tap="showPartnerInfo = false">
      <view class="popup-content" @tap.stop>
        <view class="popup-header">
          <text class="popup-title">伴侣信息</text>
          <text class="popup-close" @tap="showPartnerInfo = false">&times;</text>
        </view>
        <view class="partner-info-card">
          <view class="partner-avatar-wrap">
            <image v-if="partnerInfo.avatar" class="partner-avatar" :src="partnerInfo.avatar" mode="aspectFill" />
            <view v-else class="partner-avatar avatar-placeholder-small">
              <text class="avatar-icon-small">&#x1F464;</text>
            </view>
          </view>
          <view class="partner-detail-list">
            <view class="partner-row">
              <text class="partner-row-label">昵称</text>
              <text class="partner-row-value">{{ partnerInfo.nickName || '未设置' }}</text>
            </view>
            <view class="partner-row">
              <text class="partner-row-label">性别</text>
              <text class="partner-row-value">{{ sexLabel(partnerInfo.sex) }}</text>
            </view>
            <view class="partner-row">
              <text class="partner-row-label">手机号</text>
              <text class="partner-row-value">{{ partnerInfo.phonenumber || '未设置' }}</text>
            </view>
          </view>
        </view>
        <view class="unbind-area">
          <view class="unbind-btn" @tap="handleUnbind">
            <text class="unbind-text">解除绑定</text>
          </view>
          <text class="unbind-hint">每人最多只能解绑一次</text>
        </view>
      </view>
    </view>

    <!-- 婚期详情弹窗 -->
    <view v-if="showDateDetail" class="popup-mask" @tap="showDateDetail = false">
      <view class="popup-content" @tap.stop>
        <view class="popup-header">
          <text class="popup-title">婚期详情</text>
          <text class="popup-close" @tap="showDateDetail = false">&times;</text>
        </view>
        <view class="date-detail-card">
          <view class="date-main">
            <text class="date-main-day">{{ dateDetail.day }}</text>
            <view class="date-main-right">
              <text class="date-main-weekday">{{ dateDetail.weekday }}</text>
              <text class="date-main-full">{{ dateDetail.gregorian }}</text>
            </view>
          </view>
          <view class="date-divider" />
          <view class="date-row">
            <text class="date-row-label">农历</text>
            <text class="date-row-value">{{ dateDetail.lunar }}</text>
          </view>
          <view class="date-row">
            <text class="date-row-label">天干地支</text>
            <text class="date-row-value">{{ dateDetail.ganzhi }}</text>
          </view>
          <view class="date-row">
            <text class="date-row-label">生肖</text>
            <text class="date-row-value">{{ dateDetail.zodiac }}</text>
          </view>
          <view class="date-row">
            <text class="date-row-label">星宿</text>
            <text class="date-row-value">{{ dateDetail.star }}</text>
          </view>
          <view class="date-row">
            <text class="date-row-label">宜</text>
            <text class="date-row-value date-yi">{{ dateDetail.yi }}</text>
          </view>
          <view class="date-row">
            <text class="date-row-label">忌</text>
            <text class="date-row-value date-ji">{{ dateDetail.ji }}</text>
          </view>
        </view>
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
import { getProfile, getPartnerProfile, updateProfile } from '@/api/profile'
import { getCoupleInfo, updateWeddingDate, unbindCouple } from '@/api/couple'
import { silentLogin } from '@/utils/auth'
import { Solar } from 'lunar-javascript'

const userStore = useUserStore()
const coupleStore = useCoupleStore()

const showDatePicker = ref(false)
const showProfileForm = ref(false)
const showAvatarPicker = ref(false)
const showPartnerInfo = ref(false)
const showDateDetail = ref(false)

const partnerInfo = ref({ nickName: '', avatar: '', sex: '', phonenumber: '' })
const dateDetail = ref({
  day: '', weekday: '', gregorian: '', lunar: '',
  ganzhi: '', zodiac: '', star: '', yi: '', ji: '',
})

const profileForm = ref({
  nickName: '',
  avatar: '',
  sex: '2',
  phonenumber: '',
})

const isLoggedIn = computed(() => !!userStore.token)
const isBound = computed(() => coupleStore.isBound)
const weddingDate = computed(() => coupleStore.weddingDate)

const avatarUrl = computed(() => resolveAvatarUrl(userStore.avatar))

function resolveAvatarUrl(avatar: string): string {
  if (!avatar) return ''
  // Local static path starts with /static
  if (avatar.startsWith('/static') || avatar.startsWith('static/')) {
    return avatar
  }
  return avatar
}

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
  // 每次显示时刷新情侣信息
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
})

function handleAvatarTap() {
  if (!isLoggedIn.value) {
    silentLogin()
  }
}

function sexLabel(sex: string): string {
  const map: Record<string, string> = { '0': '男', '1': '女', '2': '未设置' }
  return map[sex] || '未设置'
}

async function handleShowPartner() {
  if (!isBound.value) return
  try {
    uni.showLoading({ title: '加载中...' })
    const info = await getPartnerProfile()
    partnerInfo.value = info
    showPartnerInfo.value = true
  } catch {
    uni.showToast({ title: '获取伴侣信息失败', icon: 'none' })
  } finally {
    uni.hideLoading()
  }
}

function handleShowDateDetail() {
  if (!weddingDate.value) return
  try {
    const d = new Date(weddingDate.value)
    const solar = Solar.fromDate(d)
    const lunar = solar.getLunar()

    const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
    const yiList = lunar.getDayYi()
    const jiList = lunar.getDayJi()

    dateDetail.value = {
      day: String(d.getDate()),
      weekday: weekdays[d.getDay()],
      gregorian: `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`,
      lunar: `${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
      ganzhi: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInGanZhi()}月 ${lunar.getDayInGanZhi()}日`,
      zodiac: lunar.getYearShengXiao(),
      star: `${lunar.getGong()}方${lunar.getXiu()}宿`,
      yi: yiList.length > 0 ? yiList.join('、') : '无',
      ji: jiList.length > 0 ? jiList.join('、') : '无',
    }
    showDateDetail.value = true
  } catch {
    uni.showToast({ title: '日期解析失败', icon: 'none' })
  }
}

function handleEditProfile() {
  if (!isLoggedIn.value) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    silentLogin()
    return
  }
  profileForm.value = {
    nickName: userStore.nickName || '',
    avatar: userStore.avatar || '',
    sex: userStore.sex || '2',
    phonenumber: userStore.phonenumber || '',
  }
  showProfileForm.value = true
}

function selectAvatar(path: string) {
  profileForm.value = { ...profileForm.value, avatar: path }
  showAvatarPicker.value = false
}

async function handleSaveProfile() {
  const d = profileForm.value
  const nickName = d.nickName.trim()
  if (!nickName) {
    uni.showToast({ title: '请输入昵称', icon: 'none' })
    return
  }
  if (nickName.length < 2 || nickName.length > 20) {
    uni.showToast({ title: '昵称需要2-20个字符', icon: 'none' })
    return
  }
  if (d.phonenumber && !/^1[3-9]\d{9}$/.test(d.phonenumber)) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
    return
  }
  try {
    uni.showLoading({ title: '保存中...' })
    await updateProfile({
      nickName,
      avatar: d.avatar,
      sex: d.sex,
      phonenumber: d.phonenumber || undefined,
    })
    // Update local store
    userStore.setUserInfo({
      userId: userStore.userId,
      nickName: d.nickName.trim(),
      avatar: d.avatar,
      sex: d.sex,
      phonenumber: d.phonenumber,
    })
    showProfileForm.value = false
    uni.showToast({ title: '保存成功', icon: 'success' })
  } catch {
    uni.showToast({ title: '保存失败，请重试', icon: 'none' })
  } finally {
    uni.hideLoading()
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

async function handleUnbind() {
  const { confirm } = await uni.showModal({
    title: '确认解绑',
    content: '解绑后双方将解除情侣关系，且每人最多只能解绑一次，确定要解绑吗？',
  })
  if (!confirm) return

  try {
    uni.showLoading({ title: '解绑中...' })
    await unbindCouple()
    coupleStore.clearCouple()
    showPartnerInfo.value = false
    uni.showToast({ title: '已解除绑定', icon: 'success' })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : '解绑失败'
    uni.showToast({ title: msg, icon: 'none' })
  } finally {
    uni.hideLoading()
  }
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
  position: relative;
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

.avatar-edit-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 36rpx;
  height: 36rpx;
  background: #ffffff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.edit-badge-text {
  font-size: 20rpx;
  color: $wedding-primary;
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

.info-value.clickable {
  color: $wedding-primary;
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

/* Popup Form */
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
  background: #ffffff;
  border-radius: 32rpx 32rpx 0 0;
  padding: 40rpx 40rpx calc(40rpx + env(safe-area-inset-bottom));
  max-height: 85vh;
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
  color: #ffffff;
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
  color: #ffffff;
}

/* Avatar selection */
.current-avatar-row {
  display: flex;
  align-items: center;
  padding: 16rpx 0;
}

.current-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: #F8F8F8;
}

.avatar-placeholder-small {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F0F0F0;
}

.avatar-icon-small {
  font-size: 40rpx;
}

.change-avatar-text {
  margin-left: 24rpx;
  font-size: 26rpx;
  color: $wedding-primary;
}

.avatar-section {
  margin-bottom: 32rpx;
}

.avatar-section-title {
  font-size: 26rpx;
  font-weight: 600;
  color: $wedding-text;
  margin-bottom: 16rpx;
  display: block;
}

.avatar-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.avatar-grid-item {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  overflow: hidden;
  border: 4rpx solid transparent;
  box-sizing: border-box;
}

.avatar-grid-item.selected {
  border-color: $wedding-primary;
  box-shadow: 0 0 0 4rpx rgba($wedding-primary, 0.2);
}

.avatar-grid-img {
  width: 100%;
  height: 100%;
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

/* Partner Info */
.partner-info-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx 0;
}

.partner-avatar-wrap {
  width: 140rpx;
  height: 140rpx;
  border-radius: 50%;
  overflow: hidden;
  margin-bottom: 24rpx;
}

.partner-avatar {
  width: 140rpx;
  height: 140rpx;
}

.partner-detail-list {
  width: 100%;
}

.partner-row {
  display: flex;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f5f5f5;
}

.partner-row:last-child {
  border-bottom: none;
}

.partner-row-label {
  font-size: 28rpx;
  color: $wedding-text-light;
}

.partner-row-value {
  font-size: 28rpx;
  color: $wedding-text;
  font-weight: 500;
}

/* Date Detail */
.date-detail-card {
  padding: 16rpx 0;
}

.date-main {
  display: flex;
  align-items: center;
  margin-bottom: 24rpx;
}

.date-main-day {
  font-size: 96rpx;
  font-weight: 800;
  color: $wedding-primary;
  line-height: 1;
  margin-right: 24rpx;
}

.date-main-right {
  display: flex;
  flex-direction: column;
}

.date-main-weekday {
  font-size: 32rpx;
  font-weight: 600;
  color: $wedding-text;
}

.date-main-full {
  font-size: 24rpx;
  color: $wedding-text-light;
  margin-top: 4rpx;
}

.date-divider {
  height: 1rpx;
  background-color: #f0f0f0;
  margin: 16rpx 0;
}

.date-row {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
}

.date-row-label {
  font-size: 26rpx;
  color: $wedding-text-light;
  flex-shrink: 0;
  width: 120rpx;
}

.date-row-value {
  font-size: 26rpx;
  color: $wedding-text;
  text-align: right;
  flex: 1;
}

.date-yi {
  color: #4caf50;
}

.date-ji {
  color: #f44336;
}

/* Unbind */
.unbind-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 32rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid #f0f0f0;
}

.unbind-btn {
  padding: 16rpx 48rpx;
  border-radius: 32rpx;
  background: #FFF5F5;
}

.unbind-text {
  font-size: 26rpx;
  color: #e74c3c;
  font-weight: 500;
}

.unbind-hint {
  font-size: 22rpx;
  color: #999;
  margin-top: 12rpx;
}
</style>
