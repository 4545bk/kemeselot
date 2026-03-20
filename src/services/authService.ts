/**
 * Kemeselot — Auth Service
 * Handles registration, login, Google auth, and token management.
 */

const API_BASE_URL = 'http://192.168.100.125:4000/api';

export interface AuthUser {
    _id: string;
    name: string;
    phone?: string;
    email?: string;
    isPremium: boolean;
    premiumSince?: string;
    profilePic?: string;
}

export interface AuthResponse {
    token: string;
    user: AuthUser;
}

export const registerUser = async (name: string, phone: string, password: string): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
};

export const loginUser = async (phone: string, password: string): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
};

export const firebaseAuth = async (firebaseUid: string, name?: string, phone?: string, email?: string, profilePic?: string): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE_URL}/auth/firebase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firebaseUid, name, phone, email, profilePic }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Firebase auth failed');
    return data;
};

export const getMe = async (token: string): Promise<{ user: AuthUser }> => {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Token invalid');
    return data;
};