import { get, post, del } from './request'

export function getCoupleInfo() {
  return get<{ coupleId: number; weddingDate: string; partnerName: string; inviteCode: string; status: number }>('/wx/couple/info')
}

export function generateInviteCode() {
  return post<string>('/wx/couple/generate')
}

export function bindByInviteCode(inviteCode: string) {
  return post('/wx/couple/bind', { inviteCode })
}

export function updateWeddingDate(weddingDate: string) {
  return post('/wx/couple/wedding-date', { weddingDate })
}

export function unbindCouple() {
  return del('/wx/couple/unbind')
}
