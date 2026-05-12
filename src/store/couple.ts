import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useCoupleStore = defineStore('couple', () => {
  const coupleId = ref(uni.getStorageSync('coupleId') || '')
  const weddingDate = ref(uni.getStorageSync('weddingDate') || '')
  const isBound = ref(uni.getStorageSync('isBound') === 'true')
  const partnerName = ref(uni.getStorageSync('partnerName') || '')

  function setCoupleInfo(info: { coupleId: string; weddingDate: string; partnerName: string }) {
    coupleId.value = info.coupleId
    weddingDate.value = info.weddingDate
    partnerName.value = info.partnerName
    isBound.value = true
    uni.setStorageSync('coupleId', info.coupleId)
    uni.setStorageSync('weddingDate', info.weddingDate)
    uni.setStorageSync('partnerName', info.partnerName)
    uni.setStorageSync('isBound', 'true')
  }

  function clearCouple() {
    coupleId.value = ''
    weddingDate.value = ''
    partnerName.value = ''
    isBound.value = false
    uni.removeStorageSync('coupleId')
    uni.removeStorageSync('weddingDate')
    uni.removeStorageSync('partnerName')
    uni.removeStorageSync('isBound')
  }

  return { coupleId, weddingDate, isBound, partnerName, setCoupleInfo, clearCouple }
})
