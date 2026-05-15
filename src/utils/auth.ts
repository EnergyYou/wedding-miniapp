import { useUserStore } from '@/store/user'
import { useCoupleStore } from '@/store/couple'
import { wxLogin } from '@/api/user'
import { getCoupleInfo } from '@/api/couple'

export async function silentLogin(): Promise<boolean> {
  const userStore = useUserStore()
  const coupleStore = useCoupleStore()

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

    // 已绑定情侣，加载情侣信息
    if (data.coupleBound) {
      try {
        const coupleInfo = await getCoupleInfo()
        coupleStore.setCoupleInfo({
          coupleId: String(coupleInfo.coupleId),
          weddingDate: coupleInfo.weddingDate || '',
          partnerName: coupleInfo.partnerName || '',
        })
      } catch {
        // 情侣信息加载失败不影响登录
      }
    }

    return true
  } catch (error) {
    const msg = error instanceof Error ? error.message : '登录失败，请重试'
    console.error('登录失败:', msg)
    uni.showToast({ title: msg, icon: 'none' })
    return false
  }
}
