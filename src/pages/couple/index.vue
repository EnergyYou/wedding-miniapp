<template>
  <view class="container">
    <!-- 状态 A: 未绑定 - 我是发起方，生成邀请码 -->
    <view v-if="mode === 'invite'" class="invite-section">
      <text class="title">邀请另一半</text>
      <text class="subtitle">将邀请码分享给你的另一半，对方输入后即可绑定</text>

      <!-- 邀请码显示区域 -->
      <view v-if="inviteCode" class="code-display">
        <text class="code-text">{{ inviteCode }}</text>
      </view>
      <view v-else class="code-placeholder">
        <text class="placeholder-text">点击下方按钮生成邀请码</text>
      </view>

      <!-- 按钮区域 -->
      <view class="btn-group">
        <button class="btn btn-primary" :loading="loading" :disabled="loading" @tap="handleGenerate">
          生成邀请码
        </button>

        <button
          v-if="inviteCode"
          class="btn btn-secondary"
          :disabled="loading"
          @tap="handleCopy"
        >
          复制邀请码
        </button>

        <button
          v-if="inviteCode"
          class="btn btn-share"
          open-type="share"
          :disabled="loading"
        >
          分享给另一半
        </button>
      </view>
    </view>

    <!-- 状态 B: 未绑定 - 我是接收方，输入邀请码 -->
    <view v-else-if="mode === 'input'" class="input-section">
      <text class="title">输入邀请码</text>
      <text class="subtitle">输入对方分享的6位邀请码完成绑定</text>

      <input
        v-model="inputCode"
        class="code-input"
        type="text"
        maxlength="6"
        placeholder="请输入6位邀请码"
        :adjust-position="true"
      />

      <button class="btn btn-primary" :loading="loading" :disabled="loading" @tap="handleBind">
        绑定
      </button>
    </view>

    <!-- 底部切换模式 -->
    <view class="switch-mode">
      <text v-if="mode === 'invite'" class="switch-text" @tap="mode = 'input'">
        我是接收方，输入邀请码
      </text>
      <text v-else class="switch-text" @tap="mode = 'invite'">
        我是发起方，生成邀请码
      </text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShareAppMessage } from '@dcloudio/uni-app'
import { useCoupleStore } from '@/store/couple'
import { getCoupleInfo, generateInviteCode, bindByInviteCode } from '@/api/couple'

const coupleStore = useCoupleStore()

const mode = ref<'invite' | 'input'>('invite')
const inviteCode = ref('')
const inputCode = ref('')
const loading = ref(false)

// 生成邀请码
async function handleGenerate() {
  loading.value = true
  try {
    const data = await generateInviteCode()
    inviteCode.value = typeof data === 'string' ? data : data.inviteCode
  } catch (e) {
    console.error('生成邀请码失败:', e)
    // request wrapper 已通过 toast 提示错误
  } finally {
    loading.value = false
  }
}

// 复制邀请码
function handleCopy() {
  uni.setClipboardData({ data: inviteCode.value })
}

// 微信分享 - 通过 uni-app 生命周期
onShareAppMessage(() => ({
  title: '快来和我一起备婚吧',
  path: `/pages/couple/index?inviteCode=${inviteCode.value}`,
}))

// 绑定
async function handleBind() {
  if (!inputCode.value || inputCode.value.length !== 6) {
    uni.showToast({ title: '请输入6位邀请码', icon: 'none' })
    return
  }
  loading.value = true
  try {
    await bindByInviteCode(inputCode.value)
    // 更新 store
    const info = await getCoupleInfo()
    coupleStore.setCoupleInfo({
      coupleId: String(info.coupleId),
      weddingDate: info.weddingDate || '',
      partnerName: info.partnerName || '',
    })
    uni.showToast({ title: '绑定成功', icon: 'success' })
    setTimeout(() => uni.switchTab({ url: '/pages/index/index' }), 1500)
  } catch (_e) {
    // error handled by request wrapper
  } finally {
    loading.value = false
  }
}

// 处理从分享链接进入的场景
function handleShareEntry() {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  const options = (currentPage as any).options || (currentPage as any).$page?.options || {}
  if (options.inviteCode) {
    mode.value = 'input'
    inputCode.value = options.inviteCode
  }
}

handleShareEntry()
</script>

<style lang="scss" scoped>
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 80vh;
  padding: 60rpx 40rpx;
}

.title {
  font-size: 48rpx;
  font-weight: bold;
  color: $wedding-primary;
  margin-bottom: 16rpx;
}

.subtitle {
  font-size: 28rpx;
  color: $wedding-text-light;
  text-align: center;
  line-height: 1.5;
  margin-bottom: 60rpx;
}

// 邀请码显示区域
.code-display {
  width: 100%;
  padding: 48rpx 32rpx;
  background-color: #fff;
  border-radius: 24rpx;
  border: 2rpx dashed $wedding-primary;
  text-align: center;
  margin-bottom: 48rpx;
}

.code-text {
  font-size: 72rpx;
  font-weight: bold;
  color: $wedding-primary;
  letter-spacing: 16rpx;
}

.code-placeholder {
  width: 100%;
  padding: 48rpx 32rpx;
  background-color: #fff;
  border-radius: 24rpx;
  border: 2rpx dashed $wedding-text-light;
  text-align: center;
  margin-bottom: 48rpx;
}

.placeholder-text {
  font-size: 28rpx;
  color: $wedding-text-light;
}

// 输入框
.code-input {
  width: 100%;
  height: 96rpx;
  background-color: #fff;
  border: 2rpx solid #e0e0e0;
  border-radius: 16rpx;
  padding: 0 32rpx;
  font-size: 36rpx;
  letter-spacing: 12rpx;
  text-align: center;
  margin-bottom: 40rpx;
  box-sizing: border-box;
}

// 按钮组
.btn-group {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.btn {
  width: 100%;
  height: 88rpx;
  line-height: 88rpx;
  border-radius: 48rpx;
  font-size: 30rpx;
  font-weight: 500;
  text-align: center;
  border: none;

  &::after {
    border: none;
  }
}

.btn-primary {
  background-color: $wedding-primary;
  color: #ffffff;
}

.btn-secondary {
  background-color: #ffffff;
  color: $wedding-primary;
  border: 2rpx solid $wedding-primary;
}

.btn-share {
  background-color: #07c160;
  color: #ffffff;
}

// 切换模式
.switch-mode {
  margin-top: 60rpx;
}

.switch-text {
  font-size: 26rpx;
  color: $wedding-secondary;
  text-decoration: underline;
}
</style>
