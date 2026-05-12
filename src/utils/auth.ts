import { useUserStore } from '@/store/user'
import { wxLogin } from '@/api/user'

export async function silentLogin(): Promise<boolean> {
  const userStore = useUserStore()

  // 已有 token，直接返回
  if (userStore.token) {
    return true
  }

  try {
    // 调用 uni.login 获取 code
    const loginRes = await new Promise<UniApp.LoginRes>((resolve, reject) => {
      uni.login({
        provider: 'weixin',
        success: resolve,
        fail: reject,
      })
    })

    // 用 code 换取后端 token
    const data = await wxLogin(loginRes.code)

    // 存储用户信息
    userStore.setToken(data.token)
    userStore.setUserInfo({
      userId: String(data.userId),
      nickName: data.nickName || '新用户',
      avatar: data.avatar || '',
    })

    return true
  } catch (error) {
    console.error('登录失败:', error)
    return false
  }
}
