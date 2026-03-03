import { queekClient } from '../lib/queek-client';
import type { User } from '../stores/userStore';
import type { ClientAuthUser } from '@queekai/client-sdk';

const mapUser = (u: ClientAuthUser): User => ({
  id: u.id,
  name: u.name,
  first_name: u.first_name ?? '',
  last_name: u.last_name ?? '',
  email: u.email,
  phone: u.phone ?? '',
  username: '',
  avatar: u.avatar,
});

export const requestOtp = (phone: string) =>
  queekClient.auth.requestOtp({ phone, countryCode: 'NG', channel: 'sms' });

export const verifyOtp = (phone: string, otpCode: string) =>
  queekClient.auth.verifyOtp({ phone, countryCode: 'NG', otpCode, platform: 'client_web' });

export const fetchMe = async (): Promise<User | null> => {
  try {
    const res = await queekClient.auth.me();
    return res.user ? mapUser(res.user) : null;
  } catch {
    return null;
  }
};

export const logoutSession = () => queekClient.auth.logout();
