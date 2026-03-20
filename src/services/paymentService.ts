/**
 * Kemeselot — Payment Service (Authenticated)
 */

import * as FileSystem from 'expo-file-system';
import { useAppStore } from '../store/appStore';

const API_BASE_URL = 'http://192.168.100.125:4000/api'; // Your laptop's Wi-Fi IP

const getToken = () => useAppStore.getState().authToken;

export interface PaymentStatusResult {
    status: 'none' | 'pending' | 'approved' | 'rejected';
    note?: string;
    submittedAt?: string;
    rejectedAt?: string;
}

export const uploadReceipt = async (imageUri: string) => {
    const token = getToken();
    if (!token) throw new Error('Not logged in');

    try {
        const response = await FileSystem.uploadAsync(
            `${API_BASE_URL}/upload-receipt`,
            imageUri,
            {
                fieldName: 'receipt',
                httpMethod: 'POST',
                uploadType: FileSystem.FileSystemUploadType.MULTIPART,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );

        const data = JSON.parse(response.body);
        if (response.status !== 201) {
            throw new Error(data.error || 'Upload failed');
        }
        return data.receipt;
    } catch (error) {
        console.error('Error uploading receipt:', error);
        throw error;
    }
};

export const checkPaymentStatus = async (): Promise<PaymentStatusResult> => {
    const token = getToken();
    if (!token) return { status: 'none' };

    try {
        const res = await fetch(`${API_BASE_URL}/payment-status`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('API Error');
        const data = await res.json();
        return data as PaymentStatusResult;
    } catch (error) {
        console.error('Error checking payment status:', error);
        return { status: 'none' };
    }
};
