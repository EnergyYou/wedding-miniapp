import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref(uni.getStorageSync('token') || '')
  const userId = ref(uni.getStorageSync('userId') || '')
  const nickName = ref(uni.getStorageSync('nickName') || '')
  const avatar = ref(uni.getStorageSync('avatar') || '')
  const sex = ref(uni.getStorageSync('sex') || '')
  const phonenumber = ref(uni.getStorageSync('phonenumber') || '')

  function setToken(val: string) {
    token.value = val
    uni.setStorageSync('token', val)
  }

  function setUserInfo(info: { userId: string; nickName: string; avatar: string; sex?: string; phonenumber?: string }) {
    userId.value = info.userId
    nickName.value = info.nickName
    avatar.value = info.avatar
    sex.value = info.sex ?? ''
    phonenumber.value = info.phonenumber ?? ''
    uni.setStorageSync('userId', info.userId)
    uni.setStorageSync('nickName', info.nickName)
    uni.setStorageSync('avatar', info.avatar)
    uni.setStorageSync('sex', sex.value)
    uni.setStorageSync('phonenumber', phonenumber.value)
  }

  function clearToken() {
    token.value = ''
    userId.value = ''
    nickName.value = ''
    avatar.value = ''
    sex.value = ''
    phonenumber.value = ''
    uni.removeStorageSync('token')
    uni.removeStorageSync('userId')
    uni.removeStorageSync('nickName')
    uni.removeStorageSync('avatar')
    uni.removeStorageSync('sex')
    uni.removeStorageSync('phonenumber')
  }

  return { token, userId, nickName, avatar, sex, phonenumber, setToken, setUserInfo, clearToken }
})
