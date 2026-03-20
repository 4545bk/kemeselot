import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { useThemeColors } from '../theme/ThemeContext';
import { useTranslation } from '../i18n/LanguageContext';
import { Spacing, FontSize, BorderRadius, getShadows } from '../theme';
import { useAppStore } from '../store/appStore';
import { firebaseAuth, loginUser, registerUser } from '../services/authService';

// Firebase & Google SDKs
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

type AuthMethod = 'password' | 'sms';
type AuthTab = 'login' | 'register';

export const AuthScreen: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
    const { colors } = useThemeColors();
    const { t } = useTranslation();
    const Shadows = getShadows(colors);
    const { setAuth } = useAppStore();

    const [loading, setLoading] = useState(false);
    
    // UI State
    const [authMethod, setAuthMethod] = useState<AuthMethod>('password');
    const [tab, setTab] = useState<AuthTab>('login');

    // Form fields
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    
    // OTP Specific
    const [confirmResult, setConfirmResult] = useState<FirebaseAuthTypes.ConfirmationResult | null>(null);
    const [otpCode, setOtpCode] = useState('');

    useEffect(() => {
        // Initialize Google Sign-In
        GoogleSignin.configure({
            webClientId: '495160419435-nduvm6athhmajg003tlevvtt7sls1206.apps.googleusercontent.com',
        });
    }, []);

    const formatPhone = (input: string) => {
        let p = input.trim();
        if (p.startsWith('09') || p.startsWith('07')) p = '+251' + p.substring(1);
        if (!p.startsWith('+')) p = '+' + p;
        return p;
    };

    // ==================== PASSWORD FLOW ====================
    const handlePasswordSubmit = async () => {
        if (!phone.trim() || !password.trim()) {
            Alert.alert('Error', 'Please enter your phone number and password');
            return;
        }

        try {
            setLoading(true);
            const formattedPhone = formatPhone(phone);
            
            if (tab === 'register') {
                if (!name.trim()) return Alert.alert('Error', 'Please enter your name');
                const data = await registerUser(name.trim(), formattedPhone, password);
                setAuth(data.token, data.user);
            } else {
                const data = await loginUser(formattedPhone, password);
                setAuth(data.token, data.user);
            }
            onSuccess();
        } catch (err: any) {
            const msg = err.message || '';
            if (msg.includes('Network request failed') || msg.includes('Failed to fetch')) {
                Alert.alert(
                    'Connection Error',
                    'Could not reach the server. Make sure:\n\n' +
                    '1. Your phone and computer are on the same Wi-Fi network\n' +
                    '2. The server is running (npm run dev in server/)\n' +
                    '3. Check the server IP address is correct'
                );
            } else {
                Alert.alert(tab === 'register' ? 'Registration Failed' : 'Login Failed', msg);
            }
        } finally {
            setLoading(false);
        }
    };

    // ==================== SMS (FIREBASE OTP) FLOW ====================
    const handleSendOTP = async () => {
        if (!phone.trim()) {
            Alert.alert('Error', 'Please enter your phone number');
            return;
        }

        try {
            setLoading(true);
            const formattedPhone = formatPhone(phone);
            const confirmation = await auth().signInWithPhoneNumber(formattedPhone);
            setConfirmResult(confirmation);
        } catch (err: any) {
            console.error('Phone Auth Error:', err);
            Alert.alert('Send Code Failed', err.message || 'Could not send SMS code.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (!otpCode || otpCode.length < 6 || !confirmResult) return;

        try {
            setLoading(true);
            const userCredential = await confirmResult.confirm(otpCode);
            
            if (userCredential && userCredential.user) {
                const firebaseUid = userCredential.user.uid;
                const userPhone = userCredential.user.phoneNumber || formatPhone(phone);
                
                const data = await firebaseAuth(firebaseUid, name || 'User', userPhone, undefined, undefined);
                setAuth(data.token, data.user);
                onSuccess();
            }
        } catch (err: any) {
            console.error('Verify OTP Error:', err);
            Alert.alert('Verification Failed', 'Invalid code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // ==================== GOOGLE FLOW ====================
    const handleGoogleSignIn = async () => {
        try {
            setLoading(true);
            await GoogleSignin.hasPlayServices();
            const signInResult = await GoogleSignin.signIn();
            
            // Get the id token for Firebase credential
            const resultData = (signInResult as any)?.data ?? signInResult;
            const idToken = resultData?.idToken ?? null;
            
            if (idToken) {
                // Full Firebase flow: create credential and sign in
                const googleCredential = auth.GoogleAuthProvider.credential(idToken);
                const userCredential = await auth().signInWithCredential(googleCredential);
                const fbUser = userCredential.user;
                
                const data = await firebaseAuth(
                    fbUser.uid,
                    fbUser.displayName || 'User',
                    fbUser.phoneNumber || undefined,
                    fbUser.email || undefined,
                    fbUser.photoURL || ''
                );
                setAuth(data.token, data.user);
            } else {
                // Fallback: use Google user info directly
                const user = resultData?.user ?? (signInResult as any)?.user;
                if (!user) throw new Error('No user data returned');
                
                const data = await firebaseAuth(
                    user.id,
                    user.name || 'User',
                    undefined,
                    user.email,
                    user.photo || ''
                );
                setAuth(data.token, data.user);
            }
            
            onSuccess();
        } catch (err: any) {
            console.error('Google Sign-In error:', err);
            const code = err?.code || '';
            if (code === 'SIGN_IN_CANCELLED' || code === '12501') {
                // User cancelled, do nothing
                return;
            }
            if (code === 'DEVELOPER_ERROR' || code === '10') {
                Alert.alert(
                    'Google Sign-In Setup Issue',
                    'The SHA-1 fingerprint of this build may not match Firebase.\n\n' +
                    'To fix: Go to Firebase Console → Project Settings → Your Apps → ' +
                    'Add the SHA-1 from your signing key.\n\n' +
                    'For now, use Phone + Password login instead!'
                );
            } else {
                Alert.alert('Google Sign-In Failed', err.message || 'Could not sign in with Google');
            }
        } finally {
            setLoading(false);
        }
    };

    const s = getStyles(colors);

    // ==================== RENDERS ====================
    const renderPasswordForm = () => (
        <>
            <View style={s.tabRow}>
                <TouchableOpacity style={[s.tab, tab === 'login' && s.tabActive]} onPress={() => setTab('login')}>
                    <Text style={[s.tabText, tab === 'login' && s.tabTextActive]}>Login</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.tab, tab === 'register' && s.tabActive]} onPress={() => setTab('register')}>
                    <Text style={[s.tabText, tab === 'register' && s.tabTextActive]}>Register</Text>
                </TouchableOpacity>
            </View>

            {tab === 'register' && (
                <View style={s.inputGroup}>
                    <Text style={s.label}>Full Name</Text>
                    <TextInput
                        style={s.input}
                        placeholder="e.g. Abebe Kebede"
                        placeholderTextColor={colors.textMuted}
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                    />
                </View>
            )}

            <View style={s.inputGroup}>
                <Text style={s.label}>Phone Number</Text>
                <TextInput
                    style={s.input}
                    placeholder="0911234567"
                    placeholderTextColor={colors.textMuted}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                />
            </View>

            <View style={s.inputGroup}>
                <Text style={s.label}>Password</Text>
                <TextInput
                    style={s.input}
                    placeholder="••••••••"
                    placeholderTextColor={colors.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>

            <TouchableOpacity
                style={[s.primaryBtn, loading && s.btnDisabled]}
                onPress={handlePasswordSubmit}
                disabled={loading}
            >
                {loading ? <ActivityIndicator color={colors.backgroundDark} /> : (
                    <Text style={s.primaryBtnText}>{tab === 'login' ? 'Sign In' : 'Create Account'}</Text>
                )}
            </TouchableOpacity>
        </>
    );

    const renderSMSForm = () => (
        <>
            <View style={{ marginBottom: Spacing.lg }}>
                <Text style={[s.title, { fontSize: FontSize.lg, textAlign: 'center' }]}>Sign in with SMS</Text>
            </View>

            {!confirmResult ? (
                <>
                    <View style={s.inputGroup}>
                        <Text style={s.label}>Phone Number</Text>
                        <TextInput
                            style={s.input}
                            placeholder="0911234567"
                            placeholderTextColor={colors.textMuted}
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <TouchableOpacity
                        style={[s.primaryBtn, loading && s.btnDisabled]}
                        onPress={handleSendOTP}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color={colors.backgroundDark} /> : <Text style={s.primaryBtnText}>Send SMS Code</Text>}
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <Text style={[s.label, { textAlign: 'center', marginBottom: Spacing.md }]}>
                        Enter the 6-digit code sent to {formatPhone(phone)}
                    </Text>

                    <View style={s.inputGroup}>
                        <TextInput
                            style={[s.input, s.otpInput]}
                            placeholder="••••••"
                            placeholderTextColor={colors.textMuted}
                            value={otpCode}
                            onChangeText={setOtpCode}
                            keyboardType="numeric"
                            maxLength={6}
                        />
                    </View>

                    <TouchableOpacity
                        style={[s.primaryBtn, loading && s.btnDisabled]}
                        onPress={handleVerifyOTP}
                        disabled={loading}
                    >
                        {loading ? <ActivityIndicator color={colors.backgroundDark} /> : <Text style={s.primaryBtnText}>Verify Code</Text>}
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={{ marginTop: Spacing.md, alignItems: 'center' }}
                        onPress={() => setConfirmResult(null)}
                    >
                        <Text style={{ color: colors.gold, fontWeight: '600' }}>Change Phone Number</Text>
                    </TouchableOpacity>
                </>
            )}
        </>
    );

    return (
        <KeyboardAvoidingView 
            style={s.root} 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
                <View style={s.header}>
                    <Text style={s.logo}>✝️</Text>
                    <Text style={s.title}>Kemeselot</Text>
                    <Text style={s.subtitle}>Sign in to unlock full features</Text>
                </View>

                {/* Main Card */}
                <View style={[s.card, Shadows.md]}>
                    {authMethod === 'password' ? renderPasswordForm() : renderSMSForm()}
                </View>

                {/* Divider */}
                <View style={s.dividerRow}>
                    <View style={s.dividerLine} />
                    <Text style={s.dividerText}>OR</Text>
                    <View style={s.dividerLine} />
                </View>

                {/* Alternate Options */}
                <View style={{ gap: Spacing.md }}>
                    <TouchableOpacity 
                        style={s.secondaryBtn} 
                        onPress={() => {
                            setAuthMethod(authMethod === 'password' ? 'sms' : 'password');
                            setConfirmResult(null); // Reset OTP state if moving away
                        }}
                    >
                        <Text style={s.secondaryBtnText}>
                            {authMethod === 'password' ? 'Use SMS Secure Code instead' : 'Use Phone & Password instead'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[s.googleBtn, loading && s.btnDisabled]} 
                        onPress={handleGoogleSignIn}
                        disabled={loading}
                    >
                        <Text style={s.googleIcon}>G</Text>
                        <Text style={s.googleBtnText}>Continue with Google</Text>
                    </TouchableOpacity>
                </View>

            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const getStyles = (colors: any) =>
    StyleSheet.create({
        root: {
            flex: 1,
            backgroundColor: colors.backgroundDark,
        },
        content: {
            padding: Spacing.xl,
            paddingTop: 60,
            paddingBottom: 100,
        },
        header: {
            alignItems: 'center',
            marginBottom: Spacing.xxl,
        },
        logo: {
            fontSize: 56,
            marginBottom: Spacing.sm,
        },
        title: {
            fontSize: FontSize.h1,
            fontWeight: '800',
            color: colors.gold,
            marginBottom: Spacing.xs,
        },
        subtitle: {
            fontSize: FontSize.sm,
            color: colors.textSecondary,
            textAlign: 'center',
        },
        card: {
            backgroundColor: colors.surface,
            borderRadius: BorderRadius.xl,
            padding: Spacing.xl,
            borderWidth: 1,
            borderColor: colors.border,
        },
        tabRow: {
            flexDirection: 'row',
            marginBottom: Spacing.lg,
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: BorderRadius.round,
            padding: 4,
        },
        tab: {
            flex: 1,
            paddingVertical: Spacing.sm,
            alignItems: 'center',
            borderRadius: BorderRadius.round,
        },
        tabActive: {
            backgroundColor: colors.gold,
        },
        tabText: {
            fontSize: FontSize.md,
            fontWeight: '600',
            color: colors.textMuted,
        },
        tabTextActive: {
            color: colors.backgroundDark,
        },
        inputGroup: {
            marginBottom: Spacing.lg,
        },
        label: {
            fontSize: FontSize.sm,
            fontWeight: '600',
            color: colors.textSecondary,
            marginBottom: Spacing.xs,
        },
        input: {
            backgroundColor: 'rgba(0,0,0,0.2)',
            borderRadius: BorderRadius.md,
            paddingHorizontal: Spacing.md,
            paddingVertical: Spacing.md,
            fontSize: FontSize.md,
            color: colors.textPrimary,
            borderWidth: 1,
            borderColor: colors.border,
        },
        otpInput: {
            fontSize: 24,
            fontWeight: '800',
            letterSpacing: 8,
            textAlign: 'center',
        },
        primaryBtn: {
            backgroundColor: colors.gold,
            paddingVertical: Spacing.md,
            borderRadius: BorderRadius.round,
            alignItems: 'center',
            marginTop: Spacing.sm,
        },
        secondaryBtn: {
            paddingVertical: Spacing.md,
            borderRadius: BorderRadius.round,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.gold,
        },
        secondaryBtnText: {
            fontSize: FontSize.md,
            fontWeight: '600',
            color: colors.gold,
        },
        btnDisabled: {
            opacity: 0.5,
        },
        primaryBtnText: {
            fontSize: FontSize.md,
            fontWeight: '700',
            color: colors.backgroundDark,
        },
        dividerRow: {
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: Spacing.xl,
        },
        dividerLine: {
            flex: 1,
            height: 1,
            backgroundColor: colors.border,
        },
        dividerText: {
            paddingHorizontal: Spacing.md,
            color: colors.textMuted,
            fontSize: FontSize.sm,
            fontWeight: '600',
        },
        googleBtn: {
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#fff',
            paddingVertical: Spacing.md,
            borderRadius: BorderRadius.round,
            borderWidth: 1,
            borderColor: '#ddd',
            gap: Spacing.sm,
        },
        googleIcon: {
            fontSize: 20,
            fontWeight: '700',
            color: '#4285F4',
        },
        googleBtnText: {
            fontSize: FontSize.md,
            fontWeight: '600',
            color: '#333',
        },
    });

export default AuthScreen;
