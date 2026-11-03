import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { KeyRound, ShieldCheck, CheckCircle2, X, Info, Lock, Sparkles } from 'lucide-react-native';
import { AuthService } from '../src/services/auth';
import { WobnimoMascot, WobnimoState } from '../src/components/WobnimoMascot';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export default function LoginScreen() {
  const router = useRouter();
  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forced password change state on first login
  const [isFirstLoginChange, setIsFirstLoginChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotRoll, setForgotRoll] = useState('');
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotStep, setForgotStep] = useState<'verify' | 'new_password'>('verify');
  const [verifiedStudentName, setVerifiedStudentName] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');
  const [resetConfirmPass, setResetConfirmPass] = useState('');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [isForgotLoading, setIsForgotLoading] = useState(false);

  // Wobnimo animated mascot state
  const [mascotState, setMascotState] = useState<WobnimoState>('idle');

  // React to student actions
  useEffect(() => {
    if (isLoading || isForgotLoading) {
      setMascotState('working');
    } else if (errorMessage || forgotError) {
      setMascotState('error');
    } else if (successMessage) {
      setMascotState('celebrating');
    } else if (rollNumber.length > 0 || password.length > 0) {
      setMascotState('listening');
    } else {
      setMascotState('idle');
    }
  }, [isLoading, isForgotLoading, errorMessage, forgotError, successMessage, rollNumber, password]);

  const handleLogin = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    const cleanRoll = rollNumber.trim().toUpperCase();
    if (!cleanRoll) {
      setErrorMessage('Please enter your student Roll Number.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await AuthService.login(cleanRoll, password);
      if (!result.success) {
        setErrorMessage(result.error || 'Invalid roll number or password.');
        return;
      }

      // Check if first-time login (password is roll number or initial seed)
      const enteredPassUpper = password.trim().toUpperCase();
      const isInitialPass = enteredPassUpper === cleanRoll || password === 'kiet123' || password === 'welcome' || result.session?.is_first_login;

      if (isInitialPass) {
        setIsFirstLoginChange(true);
      } else if (!result.session?.has_consented) {
        router.replace('/consent');
      } else if (!result.session?.has_completed_setup) {
        router.replace('/setup');
      } else {
        router.replace('/(tabs)');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    setErrorMessage(null);
    if (newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await AuthService.changePassword(newPassword);
      if (res.success) {
        router.replace('/consent');
      } else {
        setErrorMessage(res.error || 'Failed to update password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Open Forgot Password Modal
  const openForgotModal = () => {
    setForgotRoll(rollNumber.trim().toUpperCase());
    setForgotPhone('');
    setForgotStep('verify');
    setForgotError(null);
    setResetNewPass('');
    setResetConfirmPass('');
    setIsForgotModalOpen(true);
  };

  // Step 1: Verify Student Identity (Roll Number + Phone)
  const handleVerifyIdentity = async () => {
    setForgotError(null);
    if (!forgotRoll.trim()) {
      setForgotError('Please enter your roll number.');
      return;
    }
    if (!forgotPhone.trim()) {
      setForgotError('Please enter your registered phone number.');
      return;
    }

    setIsForgotLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/student/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify',
          roll_number: forgotRoll.trim().toUpperCase(),
          phone: forgotPhone.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setForgotError(data.error || 'Student verification failed. Please check your roll number and phone.');
        return;
      }

      setVerifiedStudentName(data.student_name || 'Student');
      setForgotStep('new_password');
    } catch {
      setForgotError('Connection error. Please try again.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  // Step 2: Set New Password
  const handleResetPasswordSubmit = async () => {
    setForgotError(null);
    if (resetNewPass.length < 6) {
      setForgotError('New password must be at least 6 characters.');
      return;
    }
    if (resetNewPass !== resetConfirmPass) {
      setForgotError('Passwords do not match.');
      return;
    }

    setIsForgotLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/student/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reset_password',
          roll_number: forgotRoll.trim().toUpperCase(),
          phone: forgotPhone.trim(),
          new_password: resetNewPass,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setForgotError(data.error || 'Failed to update password.');
        return;
      }

      setIsForgotModalOpen(false);
      setSuccessMessage('Password reset successfully! Please log in with your new password.');
      setPassword(resetNewPass);
      setRollNumber(forgotRoll.trim().toUpperCase());
    } catch {
      setForgotError('Connection error. Please try again.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Brand Header */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <ShieldCheck size={28} color="#0284C7" strokeWidth={2.4} />
            </View>
            <Text style={styles.brandTitle}>KIET SMART CARE</Text>
            <Text style={styles.brandSubtitle}>Student Healthcare & Medication Alarms</Text>
          </View>

          {/* First Login Highlight Notice */}
          {!isFirstLoginChange && (
            <View style={styles.firstLoginBanner}>
              <View style={styles.firstLoginIcon}>
                <Info size={18} color="#0284C7" />
              </View>
              <View style={styles.firstLoginTextWrap}>
                <Text style={styles.firstLoginTitle}>First Time Logging In?</Text>
                <Text style={styles.firstLoginDesc}>
                  Your <Text style={styles.boldText}>Username</Text> is your Roll Number (e.g. 23B21A4565). Your <Text style={styles.boldText}>Initial Password</Text> is also your Roll Number. You will be prompted to set your personal password immediately.
                </Text>
              </View>
            </View>
          )}

          {/* Card Container */}
          <View style={styles.card}>
            {isFirstLoginChange ? (
              // First Login Force Password Change View
              <View>
                <View style={styles.headerRow}>
                  <View style={styles.headerIconCircle}>
                    <Lock size={20} color="#0284C7" />
                  </View>
                  <View>
                    <Text style={styles.formTitle}>Set Your New Password</Text>
                    <Text style={styles.formSubtitle}>Choose a secure password for future logins</Text>
                  </View>
                </View>

                {errorMessage && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>New Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter new password (min 6 chars)"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    value={newPassword}
                    onChangeText={setNewPassword}
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Confirm New Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm new password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, isLoading && styles.disabledButton]}
                  onPress={handlePasswordChange}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Set Password & Continue</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              // Standard Login Form
              <View>
                <Text style={styles.formTitle}>Student Sign In</Text>
                <Text style={styles.formSubtitle}>Enter your institutional roll number</Text>

                {errorMessage && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}

                {successMessage && (
                  <View style={styles.successBox}>
                    <CheckCircle2 size={16} color="#059669" />
                    <Text style={styles.successText}>{successMessage}</Text>
                  </View>
                )}

                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Roll Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 23B21A4565"
                    placeholderTextColor="#94A3B8"
                    value={rollNumber}
                    onChangeText={(txt) => setRollNumber(txt.toUpperCase())}
                    autoCapitalize="characters"
                    autoCorrect={false}
                  />
                </View>

                <View style={styles.fieldGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>Password</Text>
                    <TouchableOpacity onPress={openForgotModal}>
                      <Text style={styles.forgotLink}>Forgot?</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter password (Roll Number if first time)"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, isLoading && styles.disabledButton]}
                  onPress={handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.primaryButtonText}>Sign In</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Wobnimo Animated Mascot Stage */}
          <View style={styles.mascotStage}>
            <WobnimoMascot character="boo" state={mascotState} size={110} />
            <View style={styles.mascotLabelWrap}>
              <Sparkles size={13} color="#38BDF8" />
              <Text style={styles.mascotLabel}>
                {mascotState === 'working'
                  ? 'Verifying identity...'
                  : mascotState === 'error'
                  ? 'Oops! Check your details'
                  : mascotState === 'celebrating'
                  ? 'Welcome aboard!'
                  : mascotState === 'listening'
                  ? 'Typing roll number...'
                  : 'Campus Health Assistant'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal visible={isForgotModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reset Student Password</Text>
              <TouchableOpacity onPress={() => setIsForgotModalOpen(false)}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {forgotError && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{forgotError}</Text>
              </View>
            )}

            {forgotStep === 'verify' ? (
              <View>
                <Text style={styles.modalDesc}>
                  Enter your roll number and registered phone number to verify your student account.
                </Text>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Roll Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 23B21A4565"
                    placeholderTextColor="#94A3B8"
                    value={forgotRoll}
                    onChangeText={(t) => setForgotRoll(t.toUpperCase())}
                    autoCapitalize="characters"
                  />
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Registered Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 9876543210"
                    placeholderTextColor="#94A3B8"
                    keyboardType="phone-pad"
                    value={forgotPhone}
                    onChangeText={setForgotPhone}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.primaryButton, isForgotLoading && styles.disabledButton]}
                  onPress={handleVerifyIdentity}
                  disabled={isForgotLoading}
                >
                  {isForgotLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Verify Account</Text>}
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text style={styles.modalDesc}>
                  Verified for <Text style={styles.boldText}>{verifiedStudentName}</Text>. Set your new password below.
                </Text>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>New Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Min 6 characters"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    value={resetNewPass}
                    onChangeText={setResetNewPass}
                  />
                </View>
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Confirm Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm new password"
                    placeholderTextColor="#94A3B8"
                    secureTextEntry
                    value={resetConfirmPass}
                    onChangeText={setResetConfirmPass}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.primaryButton, isForgotLoading && styles.disabledButton]}
                  onPress={handleResetPasswordSubmit}
                  disabled={isForgotLoading}
                >
                  {isForgotLoading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Update Password</Text>}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    justifyContent: 'center',
    flexGrow: 1,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.2,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  firstLoginBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.28)',
    padding: 14,
    marginBottom: 18,
    gap: 12,
  },
  firstLoginIcon: {
    marginTop: 2,
  },
  firstLoginTextWrap: {
    flex: 1,
  },
  firstLoginTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#38BDF8',
    marginBottom: 4,
  },
  firstLoginDesc: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 18,
  },
  boldText: {
    fontWeight: '700',
    color: '#FFFFFF',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  headerIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0F2FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  formSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 16,
  },
  errorBox: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    fontWeight: '500',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  successText: {
    flex: 1,
    fontSize: 13,
    color: '#059669',
    fontWeight: '500',
  },
  fieldGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  forgotLink: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0284C7',
  },
  input: {
    height: 48,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#0F172A',
  },
  primaryButton: {
    height: 50,
    backgroundColor: '#0284C7',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  mascotStage: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 10,
    gap: 8,
  },
  mascotLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  mascotLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#38BDF8',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalDesc: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 18,
  },
});
