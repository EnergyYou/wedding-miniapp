import { useUserStore } from '@/store/user'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'

interface ApiResponse<T = any> {
  code: number
  msg: string
  data: T
}

export function request<T = any>(options: UniApp.RequestOptions): Promise<T> {
  const userStore = useUserStore()

  const { method, data } = options
  const isBodyMethod = method === 'POST' || method === 'PUT' || method === 'DELETE'

  return new Promise((resolve, reject) => {
    uni.request({
      ...options,
      url: BASE_URL + options.url,
      method,
      data: isBodyMethod && data ? JSON.stringify(data) : data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': userStore.token ? `Bearer ${userStore.token}` : '',
        ...options.header,
      },
      success: (res) => {
        const responseData = res.data as ApiResponse<T>
        if (responseData.code === 200) {
          resolve(responseData.data)
        } else if (responseData.code === 401) {
          userStore.clearToken()
          uni.showToast({ title: '登录已过期，请重新登录', icon: 'none' })
          reject(new Error('未登录或登录已过期'))
        } else {
          uni.showToast({ title: responseData.msg || '请求失败', icon: 'none' })
          reject(new Error(responseData.msg))
        }
      },
      fail: (err) => {
        uni.showToast({ title: '网络错误', icon: 'none' })
        reject(err)
      },
    })
  })
}

export function get<T = any>(url: string, data?: any): Promise<T> {
  return request<T>({ url, method: 'GET', data })
}

export function post<T = any>(url: string, data?: any): Promise<T> {
  return request<T>({ url, method: 'POST', data })
}

export function put<T = any>(url: string, data?: any): Promise<T> {
  return request<T>({ url, method: 'PUT', data })
}

export function del<T = any>(url: string, data?: any): Promise<T> {
  return request<T>({ url, method: 'DELETE', data })
}
