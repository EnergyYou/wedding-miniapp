<template>
  <view class="page">
    <!-- 筛选标签 -->
    <view class="filter-tabs">
      <view
        v-for="tab in filterTabs"
        :key="tab.key"
        class="filter-tab"
        :class="{ active: activeFilter === tab.key }"
        @tap="activeFilter = tab.key"
      >
        <text>{{ tab.label }}</text>
      </view>
    </view>

    <!-- 汇总统计 -->
    <view class="summary-row">
      <view class="summary-item">
        <text class="summary-value total">{{ items.length }}</text>
        <text class="summary-label">总物品</text>
      </view>
      <view class="summary-item">
        <text class="summary-value purchased">{{ items.filter(i => i.purchaseStatus === 2).length }}</text>
        <text class="summary-label">已采购</text>
      </view>
      <view class="summary-item">
        <text class="summary-value in-progress">{{ items.filter(i => i.purchaseStatus === 1).length }}</text>
        <text class="summary-label">采购中</text>
      </view>
      <view class="summary-item">
        <text class="summary-value pending">{{ items.filter(i => i.purchaseStatus === 0).length }}</text>
        <text class="summary-label">未采购</text>
      </view>
    </view>

    <!-- 分类区块 -->
    <view v-for="cat in categories" :key="cat.name" class="category-section">
      <view class="category-header" @tap="toggleCategory(cat.name)">
        <view class="category-left">
          <text class="category-icon">{{ cat.icon }}</text>
          <text class="category-name">{{ cat.name }}</text>
          <text class="category-count">{{ getCatProgress(cat.name) }}</text>
        </view>
        <view class="category-right">
          <view class="mini-progress">
            <view class="mini-progress-fill" :style="{ width: getCatPercent(cat.name) + '%' }"></view>
          </view>
          <text class="collapse-arrow" :class="{ expanded: !collapsedCats.has(cat.name) }">&#9662;</text>
        </view>
      </view>

      <view v-if="!collapsedCats.has(cat.name)" class="category-items">
        <view v-for="item in getCatItems(cat.name)" :key="item.id" class="item-row" @tap="handleEdit(item)">
          <text class="status-icon" :class="statusClass(item.purchaseStatus)">{{ statusIcon(item.purchaseStatus) }}</text>
          <view class="item-info">
            <text class="item-name" :class="{ done: item.purchaseStatus === 2 }">{{ item.name }}</text>
            <view class="item-meta">
              <text class="item-qty">{{ item.quantity }}x ¥{{ item.price }}</text>
              <text class="assignee-badge" :class="'assignee-' + item.assignee">{{ assigneeLabel(item.assignee) }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- FAB 添加按钮 -->
    <view class="fab" @tap="handleAdd">
      <text class="fab-text">+</text>
    </view>

    <!-- 物品表单弹窗 -->
    <view v-if="showForm" class="popup-mask" @tap="showForm = false">
      <view class="popup-content" @tap.stop>
        <view class="popup-header">
          <text class="popup-title">{{ editingItem ? '编辑物品' : '添加物品' }}</text>
          <text class="popup-close" @tap="showForm = false">✕</text>
        </view>
        <view class="form-group">
          <text class="form-label">物品名称</text>
          <input v-model="formData.name" class="form-input" placeholder="如：喜糖盒" />
        </view>
        <view class="form-group">
          <text class="form-label">分类</text>
          <input v-model="formData.category" class="form-input" placeholder="如：喜糖" />
        </view>
        <view class="form-group">
          <text class="form-label">数量</text>
          <input v-model="formData.quantity" class="form-input" type="number" placeholder="1" />
        </view>
        <view class="form-group">
          <text class="form-label">单价 (元)</text>
          <input v-model="formData.price" class="form-input" type="digit" placeholder="0.00" />
        </view>
        <view class="form-group">
          <text class="form-label">负责人</text>
          <view class="form-picker">
            <view
              v-for="opt in assigneeOptions"
              :key="opt.value"
              class="form-picker-item"
              :class="{ active: formData.assignee === opt.value }"
              @tap="formData.assignee = opt.value"
            >
              <text>{{ opt.label }}</text>
            </view>
          </view>
        </view>
        <view class="form-group">
          <text class="form-label">备注</text>
          <input v-model="formData.remark" class="form-input" placeholder="选填" />
        </view>
        <view class="form-actions">
          <button v-if="editingItem" class="form-btn form-btn-delete" @tap="handleDelete">删除</button>
          <button class="form-btn form-btn-cancel" @tap="showForm = false">取消</button>
          <button class="form-btn form-btn-submit" @tap="handleSubmit">保存</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { getItemList, getItemCategories, createItem, updateItem, deleteItem } from '../../api/item'
import type { Item } from '../../api/item'

const activeFilter = ref('all')
const collapsedCats = reactive(new Set<string>())
const loading = ref(false)

const filterTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '未采购' },
  { key: 'in-progress', label: '采购中' },
  { key: 'purchased', label: '已采购' },
]

const catNameToIcon: Record<string, string> = {
  '婚房用品': '🏠',
  '伴手礼': '🎁',
  '喜糖': '🍬',
  '新人用品': '💒',
}

const items = ref<Item[]>([])
const categoryNames = ref<string[]>([])

const categories = computed(() =>
  categoryNames.value.map(name => ({
    name,
    icon: catNameToIcon[name] || '📦',
  }))
)

const filteredItems = computed(() => {
  if (activeFilter.value === 'all') return items.value
  const statusMap: Record<string, number> = {
    'pending': 0,
    'in-progress': 1,
    'purchased': 2,
  }
  const targetStatus = statusMap[activeFilter.value]
  return items.value.filter(i => i.purchaseStatus === targetStatus)
})

function toggleCategory(name: string) {
  if (collapsedCats.has(name)) {
    collapsedCats.delete(name)
  } else {
    collapsedCats.add(name)
  }
}

function getCatItems(catName: string): Item[] {
  return filteredItems.value.filter(i => i.category === catName)
}

function getCatProgress(catName: string): string {
  const catItems = getCatItems(catName)
  const done = catItems.filter(i => i.purchaseStatus === 2).length
  return `${done}/${catItems.length}`
}

function getCatPercent(catName: string): number {
  const catItems = getCatItems(catName)
  if (catItems.length === 0) return 0
  return Math.round((catItems.filter(i => i.purchaseStatus === 2).length / catItems.length) * 100)
}

function statusIcon(status: number): string {
  return status === 2 ? '✅' : status === 1 ? '⟳' : '☐'
}

function statusClass(status: number): string {
  return status === 2 ? 'status-done' : status === 1 ? 'status-progress' : 'status-pending'
}

function assigneeLabel(assignee: number): string {
  return assignee === 1 ? '郎' : assignee === 2 ? '娘' : '共'
}

function handleAdd() {
  editingItem.value = null
  formData.value = { name: '', category: '', quantity: '1', price: '', assignee: 0, remark: '' }
  showForm.value = true
}

function handleEdit(item: Item) {
  editingItem.value = item
  formData.value = {
    name: item.name,
    category: item.category,
    quantity: String(item.quantity ?? 1),
    price: item.price ?? '',
    assignee: item.assignee ?? 0,
    remark: item.remark ?? '',
  }
  showForm.value = true
}

async function handleDelete() {
  if (!editingItem.value) return
  uni.showModal({
    title: '确认删除',
    content: `确定要删除"${editingItem.value.name}"吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await deleteItem(editingItem.value!.id)
          showForm.value = false
          uni.showToast({ title: '已删除', icon: 'success' })
          await Promise.all([fetchItems(), fetchCategories()])
        } catch {
          // error handled by request wrapper
        }
      }
    },
  })
}

async function handleSubmit() {
  const d = formData.value
  if (!d.name.trim()) {
    uni.showToast({ title: '请输入物品名称', icon: 'none' })
    return
  }
  try {
    if (editingItem.value) {
      await updateItem({
        id: editingItem.value.id,
        category: d.category || undefined,
        name: d.name,
        quantity: d.quantity ? Number(d.quantity) : undefined,
        price: d.price || undefined,
        assignee: d.assignee,
        remark: d.remark || undefined,
      })
    } else {
      await createItem({
        category: d.category || undefined,
        name: d.name,
        quantity: d.quantity ? Number(d.quantity) : undefined,
        price: d.price || undefined,
        assignee: d.assignee,
        remark: d.remark || undefined,
      })
    }
    showForm.value = false
    uni.showToast({ title: '保存成功', icon: 'success' })
    await Promise.all([fetchItems(), fetchCategories()])
  } catch {
    // error handled by request wrapper
  }
}

// ---------- Form state ----------
const showForm = ref(false)
const editingItem = ref<Item | null>(null)
const formData = ref({
  name: '',
  category: '',
  quantity: '1',
  price: '',
  assignee: 0,
  remark: '',
})

const assigneeOptions = [
  { value: 0, label: '共同' },
  { value: 1, label: '新郎' },
  { value: 2, label: '新娘' },
]

async function fetchCategories() {
  try {
    const result = await getItemCategories()
    categoryNames.value = result ?? []
  } catch {
    categoryNames.value = []
  }
}

async function fetchItems() {
  loading.value = true
  try {
    const result = await getItemList()
    items.value = result ?? []
  } catch {
    uni.showToast({ title: '获取物品列表失败', icon: 'none' })
    items.value = []
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchCategories(), fetchItems()])
})
</script>

<style lang="scss" scoped>
.page {
  min-height: 100vh;
  background-color: $wedding-bg;
  padding-bottom: 120rpx;
}

.filter-tabs {
  display: flex;
  padding: 24rpx 32rpx;
  gap: 16rpx;
}

.filter-tab {
  padding: 12rpx 32rpx;
  border-radius: 40rpx;
  font-size: 26rpx;
  background: #ffffff;
  color: #666;
  border: 1rpx solid #eee;
}

.filter-tab.active {
  background: $wedding-primary;
  color: #ffffff;
  border-color: $wedding-primary;
}

.summary-row {
  display: flex;
  padding: 0 32rpx 24rpx;
  gap: 16rpx;
}

.summary-item {
  flex: 1;
  text-align: center;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 20rpx 0;
}

.summary-value {
  font-size: 36rpx;
  font-weight: 700;
  display: block;
}

.summary-label {
  font-size: 22rpx;
  color: #999;
  display: block;
  margin-top: 4rpx;
}

.summary-value.total { color: $wedding-text; }
.summary-value.purchased { color: #4CAF50; }
.summary-value.in-progress { color: #FF9800; }
.summary-value.pending { color: #999; }

.category-section {
  margin: 0 32rpx 16rpx;
  background: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
}

.category-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 28rpx 28rpx;
}

.category-header:active {
  background: #FAFAFA;
}

.category-left {
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.category-icon {
  font-size: 36rpx;
}

.category-name {
  font-size: 30rpx;
  font-weight: 600;
}

.category-count {
  font-size: 24rpx;
  color: $wedding-primary;
  background: #FFF0F5;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.category-right {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.mini-progress {
  width: 100rpx;
  height: 8rpx;
  background: #F0F0F0;
  border-radius: 4rpx;
  overflow: hidden;
}

.mini-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, $wedding-primary, $wedding-accent);
  border-radius: 4rpx;
  transition: width 0.3s;
}

.collapse-arrow {
  font-size: 24rpx;
  color: #ccc;
  transition: transform 0.3s;
}

.collapse-arrow.expanded {
  transform: rotate(180deg);
}

.category-items {
  border-top: 1rpx solid #F5F5F5;
}

.item-row {
  display: flex;
  align-items: center;
  padding: 20rpx 28rpx;
  border-bottom: 1rpx solid #FAFAFA;
}

.item-row:last-child {
  border-bottom: none;
}

.status-icon {
  font-size: 32rpx;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.status-icon.status-done { color: #4CAF50; }
.status-icon.status-progress { color: #FF9800; }
.status-icon.status-pending { color: #ccc; }

.item-info {
  flex: 1;
}

.item-name {
  font-size: 28rpx;
  font-weight: 500;
  display: block;
}

.item-name.done {
  text-decoration: line-through;
  color: #ccc;
}

.item-meta {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-top: 6rpx;
}

.item-qty {
  font-size: 24rpx;
  color: #999;
}

.assignee-badge {
  font-size: 20rpx;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  line-height: 40rpx;
}

.assignee-0 { background: #FFF3E0; color: #F57C00; }
.assignee-1 { background: #E3F2FD; color: #1976D2; }
.assignee-2 { background: #FCE4EC; color: #E91E63; }

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

/* ---------- Popup Form ---------- */
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
  justify-content: center;
}

.popup-content {
  width: 100%;
  background: #ffffff;
  border-radius: 32rpx 32rpx 0 0;
  padding: 40rpx 40rpx calc(40rpx + env(safe-area-inset-bottom));
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

.form-btn::after { border: none; }

.form-btn-cancel {
  background: #F0F0F0;
  color: #666;
}

.form-btn-submit {
  background: linear-gradient(135deg, $wedding-primary, $wedding-accent);
  color: #ffffff;
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
  color: #ffffff;
}
</style>
