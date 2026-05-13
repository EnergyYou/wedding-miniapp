<template>
  <view class="page">
    <!-- 分类筛选 -->
    <scroll-view scroll-x class="filter-scroll">
      <view class="filter-tabs">
        <view
          v-for="cat in allCategories"
          :key="cat"
          class="filter-tab"
          :class="{ active: activeCategory === cat }"
          @tap="activeCategory = cat"
        >
          <text>{{ cat }}</text>
        </view>
      </view>
    </scroll-view>

    <!-- 统计摘要 -->
    <view class="stats-row">
      <view class="stat-card">
        <text class="stat-num" style="color: #FF9800">{{ vendors.filter(v => v.status === 0).length }}</text>
        <text class="stat-label">备选</text>
      </view>
      <view class="stat-card">
        <text class="stat-num" style="color: #4CAF50">{{ vendors.filter(v => v.status === 1).length }}</text>
        <text class="stat-label">已签约</text>
      </view>
      <view class="stat-card">
        <text class="stat-num" style="color: #999">{{ vendors.filter(v => v.status === 2).length }}</text>
        <text class="stat-label">已排除</text>
      </view>
    </view>

    <!-- 供应商列表 -->
    <view v-for="cat in displayCategories" :key="cat" class="vendor-category">
      <text class="cat-title">{{ cat }}</text>

      <view
        v-for="v in getVendorsByCat(cat)"
        :key="v.id"
        class="vendor-card"
        :class="{ excluded: v.status === 2 }"
        @tap="handleEdit(v)"
      >
        <view class="card-header">
          <view class="card-title-row">
            <text class="vendor-name" :class="{ 'name-excluded': v.status === 2 }">{{ v.name }}</text>
            <view class="status-badge" :class="'status-' + v.status">
              <text class="status-text">{{ statusLabel(v.status) }}</text>
            </view>
          </view>
          <view class="rating-row">
            <text class="stars">{{ renderStars(v.score ?? 0) }}</text>
            <text class="price">{{ v.priceQuote || '暂无报价' }}</text>
          </view>
        </view>

        <view class="card-body">
          <view class="info-row">
            <text class="info-label">联系人</text>
            <text class="info-value">{{ v.contact || '未填写' }}</text>
          </view>
          <text v-if="v.remark" class="remark">{{ v.remark }}</text>
        </view>
      </view>
    </view>

    <!-- FAB -->
    <view class="fab" @tap="handleAdd">
      <text class="fab-text">+</text>
    </view>

    <!-- 表单弹窗 -->
    <view v-if="showForm" class="popup-mask" @tap="closeForm">
      <view class="popup-content" @tap.stop>
        <view class="popup-header">
          <text class="popup-title">{{ isEdit ? '编辑供应商' : '添加供应商' }}</text>
          <text class="popup-close" @tap="closeForm">×</text>
        </view>

        <!-- 名称 -->
        <view class="form-group">
          <text class="form-label">名称 *</text>
          <input
            v-model="form.name"
            class="form-input"
            placeholder="请输入供应商名称"
          />
        </view>

        <!-- 分类 -->
        <view class="form-group">
          <text class="form-label">分类</text>
          <input
            v-model="form.category"
            class="form-input"
            placeholder="请输入分类（如：摄影、化妆、司仪）"
          />
        </view>

        <!-- 联系人 -->
        <view class="form-group">
          <text class="form-label">联系人</text>
          <input
            v-model="form.contact"
            class="form-input"
            placeholder="请输入联系人"
          />
        </view>

        <!-- 报价 -->
        <view class="form-group">
          <text class="form-label">报价</text>
          <input
            v-model="form.priceQuote"
            class="form-input"
            placeholder="请输入报价"
          />
        </view>

        <!-- 评分 -->
        <view class="form-group">
          <text class="form-label">评分</text>
          <view class="star-picker">
            <text
              v-for="s in 5"
              :key="s"
              class="star-item"
              :class="{ active: s <= form.score }"
              @tap="form.score = s"
            >★</text>
          </view>
        </view>

        <!-- 状态 -->
        <view class="form-group">
          <text class="form-label">状态</text>
          <view class="form-picker">
            <view
              v-for="opt in statusOptions"
              :key="opt.value"
              class="form-picker-item"
              :class="{ active: form.status === opt.value }"
              @tap="form.status = opt.value"
            >
              <text>{{ opt.label }}</text>
            </view>
          </view>
        </view>

        <!-- 备注 -->
        <view class="form-group">
          <text class="form-label">备注</text>
          <input
            v-model="form.remark"
            class="form-input"
            placeholder="请输入备注"
          />
        </view>

        <!-- 操作按钮 -->
        <view class="form-actions">
          <button v-if="isEdit" class="form-btn form-btn-delete" @tap="handleDelete">删除</button>
          <button class="form-btn form-btn-cancel" @tap="closeForm">取消</button>
          <button class="form-btn form-btn-submit" @tap="handleSubmit">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getVendorList, getVendorCategories, createVendor, updateVendor, deleteVendor } from '../../api/vendor'
import type { Vendor } from '../../api/vendor'

const activeCategory = ref('全部')
const vendors = ref<Vendor[]>([])
const categories = ref<string[]>([])

const showForm = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)

const defaultForm = () => ({
  name: '',
  category: '',
  contact: '',
  priceQuote: '',
  score: 0,
  status: 0,
  remark: ''
})

const form = ref(defaultForm())

const statusOptions = [
  { value: 0, label: '备选' },
  { value: 1, label: '已签约' },
  { value: 2, label: '已排除' }
]

const allCategories = computed(() => {
  return ['全部', ...categories.value]
})

const displayCategories = computed(() => {
  if (activeCategory.value === '全部') {
    return categories.value
  }
  return [activeCategory.value]
})

function getVendorsByCat(cat: string): Vendor[] {
  return vendors.value.filter(v => v.category === cat)
}

function renderStars(score: number): string {
  return '★'.repeat(score) + '☆'.repeat(5 - score)
}

function statusLabel(status: number): string {
  return status === 1 ? '已签约' : status === 2 ? '已排除' : '备选'
}

function handleAdd() {
  isEdit.value = false
  editingId.value = null
  form.value = defaultForm()
  showForm.value = true
}

function handleEdit(vendor: Vendor) {
  isEdit.value = true
  editingId.value = vendor.id
  form.value = {
    name: vendor.name,
    category: vendor.category,
    contact: vendor.contact ?? '',
    priceQuote: vendor.priceQuote ?? '',
    score: vendor.score ?? 0,
    status: vendor.status,
    remark: vendor.remark ?? ''
  }
  showForm.value = true
}

function closeForm() {
  showForm.value = false
}

async function handleSubmit() {
  if (!form.value.name.trim()) {
    uni.showToast({ title: '请输入供应商名称', icon: 'none' })
    return
  }

  try {
    if (isEdit.value && editingId.value !== null) {
      await updateVendor({
        id: editingId.value,
        name: form.value.name.trim(),
        category: form.value.category.trim(),
        contact: form.value.contact.trim() || undefined,
        priceQuote: form.value.priceQuote.trim() || undefined,
        score: form.value.score || undefined,
        status: form.value.status,
        remark: form.value.remark.trim() || undefined
      })
      uni.showToast({ title: '修改成功', icon: 'success' })
    } else {
      await createVendor({
        name: form.value.name.trim(),
        category: form.value.category.trim(),
        contact: form.value.contact.trim() || undefined,
        priceQuote: form.value.priceQuote.trim() || undefined,
        score: form.value.score || undefined,
        status: form.value.status,
        remark: form.value.remark.trim() || undefined
      })
      uni.showToast({ title: '添加成功', icon: 'success' })
    }

    showForm.value = false
    await Promise.all([fetchCategories(), fetchVendors()])
  } catch {
    uni.showToast({ title: '操作失败，请重试', icon: 'none' })
  }
}

async function handleDelete() {
  if (editingId.value === null) return

  const { confirm } = await uni.showModal({
    title: '确认删除',
    content: '确定要删除该供应商吗？删除后不可恢复。'
  })

  if (!confirm) return

  try {
    await deleteVendor(editingId.value)
    uni.showToast({ title: '删除成功', icon: 'success' })
    showForm.value = false
    await Promise.all([fetchCategories(), fetchVendors()])
  } catch {
    uni.showToast({ title: '删除失败，请重试', icon: 'none' })
  }
}

async function fetchCategories() {
  try {
    const result = await getVendorCategories()
    categories.value = result ?? []
  } catch {
    uni.showToast({ title: '获取分类失败', icon: 'none' })
    categories.value = []
  }
}

async function fetchVendors() {
  try {
    const result = await getVendorList()
    vendors.value = result ?? []
  } catch {
    uni.showToast({ title: '获取供应商列表失败', icon: 'none' })
    vendors.value = []
  }
}

onMounted(async () => {
  await Promise.all([fetchCategories(), fetchVendors()])
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: $wedding-bg;
  padding-bottom: 120rpx;
}

.filter-scroll {
  white-space: nowrap;
  padding: 24rpx 32rpx;
}

.filter-tabs {
  display: inline-flex;
  gap: 16rpx;
}

.filter-tab {
  padding: 12rpx 28rpx;
  border-radius: 40rpx;
  font-size: 26rpx;
  background: #ffffff;
  color: #666;
  border: 1rpx solid #eee;
  flex-shrink: 0;
}

.filter-tab.active {
  background: $wedding-primary;
  color: #ffffff;
  border-color: $wedding-primary;
}

.stats-row {
  display: flex;
  padding: 0 32rpx 24rpx;
  gap: 16rpx;
}

.stat-card {
  flex: 1;
  text-align: center;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 20rpx 0;
}

.stat-num {
  font-size: 36rpx;
  font-weight: 700;
  display: block;
}

.stat-label {
  font-size: 22rpx;
  color: #999;
  display: block;
  margin-top: 4rpx;
}

.vendor-category {
  padding: 0 32rpx 16rpx;
}

.cat-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #666;
  margin-bottom: 16rpx;
  display: block;
}

.vendor-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 16rpx;
  box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.04);
}

.vendor-card.excluded {
  opacity: 0.6;
}

.card-header {
  margin-bottom: 20rpx;
}

.card-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.vendor-name {
  font-size: 32rpx;
  font-weight: 600;
}

.name-excluded {
  text-decoration: line-through;
  color: #999;
}

.status-badge {
  padding: 6rpx 20rpx;
  border-radius: 20rpx;
  font-size: 22rpx;
}

.status-0 { background: #FFF3E0; }
.status-0 .status-text { color: #F57C00; }
.status-1 { background: #E8F5E9; }
.status-1 .status-text { color: #4CAF50; }
.status-2 { background: #F5F5F5; }
.status-2 .status-text { color: #999; }

.rating-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12rpx;
}

.stars {
  font-size: 28rpx;
  color: #FFB300;
  letter-spacing: 2rpx;
}

.price {
  font-size: 28rpx;
  font-weight: 600;
  color: $wedding-accent;
}

.card-body {
  border-top: 1rpx solid #F5F5F5;
  padding-top: 20rpx;
}

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}

.info-label {
  font-size: 24rpx;
  color: #999;
  margin-right: 16rpx;
}

.info-value {
  font-size: 24rpx;
  color: $wedding-text;
}

.tags-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8rpx;
  margin-bottom: 12rpx;
}

.tag {
  font-size: 22rpx;
  background: #F5F5F5;
  color: #666;
  padding: 4rpx 16rpx;
  border-radius: 8rpx;
}

.remark {
  font-size: 24rpx;
  color: #999;
  line-height: 1.5;
  display: block;
}

.fab {
  position: fixed;
  bottom: 140rpx;
  right: 40rpx;
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, $wedding-primary, $wedding-accent);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(232, 160, 191, 0.4);
  z-index: 100;
}

.fab:active {
  transform: scale(0.95);
}

.fab-text {
  font-size: 48rpx;
  color: #ffffff;
  font-weight: 300;
}

/* 弹窗样式 */
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
  background: #fff;
  border-radius: 32rpx 32rpx 0 0;
  padding: 40rpx 40rpx calc(40rpx + env(safe-area-inset-bottom));
  max-height: 90vh;
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
  color: #fff;
}

.form-btn-delete {
  background: #FFF1F0;
  color: #FF4D4F;
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
  color: #fff;
}

.star-picker {
  display: flex;
  gap: 8rpx;
}

.star-item {
  font-size: 40rpx;
  color: #ddd;
}

.star-item.active {
  color: #FFB300;
}
</style>
