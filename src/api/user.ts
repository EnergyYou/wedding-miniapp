import { post, get } from './request'

export function wxLogin(code: string) {
  return post<{ userId: number; token: string; nickName: string; avatar: string; coupleBound: boolean }>('/wx/auth/login', { code })
}

export function getUserInfo() {
  return get<{ userId: number; nickName: string; avatar: string; coupleBound: boolean }>('/wx/auth/userinfo')
}

export function logout() {
  return post('/wx/auth/logout')
}
