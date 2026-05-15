import { get, put } from './request'

export interface UserProfile {
  nickName: string
  avatar: string
  sex: string
  phonenumber: string
}

export function getProfile(): Promise<UserProfile> {
  return get<UserProfile>('/wx/profile')
}

export function getPartnerProfile(): Promise<UserProfile> {
  return get<UserProfile>('/wx/profile/partner')
}

export function updateProfile(data: Partial<UserProfile>): Promise<void> {
  return put('/wx/profile', data)
}
