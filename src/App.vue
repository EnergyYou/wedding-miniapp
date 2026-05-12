<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { silentLogin } from '@/utils/auth'

onLaunch(() => {
  console.log('App Launch')
  silentLogin()
})

onShow(() => {
  console.log('App Show')
})

onHide(() => {
  console.log('App Hide')
})
</script>

<style lang="scss">
page {
  background-color: $wedding-bg;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    'Helvetica Neue', Arial, sans-serif;
  color: $wedding-text;
  font-size: 28rpx;
  line-height: 1.6;
}
</style>
