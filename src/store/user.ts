import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref(uni.getStorageSync('token') || '')
  const userId = ref(uni.getStorageSync('userId') || '')
  const nickName = ref(uni.getStorageSync('nickName') || '')
  const avatar = ref(uni.getStorageSync('avatar') || '')

  function setToken(val: string) {
    token.value = val
    uni.setStorageSync('token', val)
  }

  function setUserInfo(info: { userId: string; nickName: string; avatar: string }) {
    userId.value = info.userId
    nickName.value = info.nickName
    avatar.value = info.avatar
    uni.setStorageSync('userId', info.userId)
    uni.setStorageSync('nickName', info.nickName)
    uni.setStorageSync('avatar', info.avatar)
  }

  function clearToken() {
    token.value = ''
    userId.value = ''
    nickName.value = ''
    avatar.value = ''
    uni.removeStorageSync('token')
    uni.removeStorageSync('userId')
    uni.removeStorageSync('nickName')
    uni.removeStorageSync('avatar')
  }

  return { token, userId, nickName, avatar, setToken, setUserInfo, clearToken }
})
