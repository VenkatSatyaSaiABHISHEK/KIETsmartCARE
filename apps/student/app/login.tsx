import React, { useState, useEffect, useRef } from 'react';
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
import { KeyRound, ShieldCheck, CheckCircle2, X } from 'lucide-react-native';
import { AuthService } from '../src/services/auth';
import { WobnimoMascot, WobnimoState } from '../src/components/WobnimoMascot';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

const PLAYFUL_IDLE_CYCLE: WobnimoState[] = [
  'idle',
  'surprised',
  'thinking',
  'speaking',
  'celebrating',
  'listening',
];

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
  const idleIndexRef = useRef(0);

  // User activity tracker
  const isUserActive =
    isLoading ||
    isForgotLoading ||
    Boolean(errorMessage) ||
    Boolean(forgotError) ||
    Boolean(successMessage) ||
    rollNumber.length > 0 ||
    password.length > 0;

  // React to student actions immediately
  useEffect(() => {
    if (isLoading || isForgotLoading) {
      setMascotState('working');
    } else if (errorMessage || forgotError) {
      setMascotState('error');
    } else if (successMessage) {
      setMascotState('celebrating');
    } else if (rollNumber.length > 0 || password.length > 0) {
      setMascotState('listening');
    }
  }, [isLoading, isForgotLoading, errorMessage, forgotError, successMessage, rollNumber, password]);

  // Automatic state rotation every 3.5 seconds when student is idle
  useEffect(() => {
    if (isUserActive) return;

    const interval = setInterval(() => {
      idleIndexRef.current = (idleIndexRef.current + 1) % PLAYFUL_IDLE_CYCLE.length;
      setMascotState(PLAYFUL_IDLE_CYCLE[idleIndexRef.current]);
    }, 3500);

    return () => clearInterval(interval);
  }, [isUserActive]);

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

      const enteredPassUpper = password.trim().toUpperCase();
      const isInitialPass =
        enteredPassUpper === cleanRoll ||
        password === 'kiet123' ||
        password === 'welcome' ||
        result.session?.is_first_login;

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
        setForgotError(data.error || 'Verification failed. Please check your details.');
        return;
      }

      setVerifiedStudentName(data.studentName || data.student_name || 'Student');
      setForgotStep('new_password');
    } catch {
      setForgotError('Network error connecting to reset service.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  // Step 2: Submit New Password
  const handleResetPassword = async () => {
    setForgotError(null);
    if (resetNewPass.length < 6) {
      setForgotError('Password must be at least 6 characters long.');
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
      setSuccessMessage('Password reset successfully! Please sign in with your new password.');
      setPassword(resetNewPass);
      setRollNumber(forgotRoll.trim().toUpperCase());
    } catch {
      setForgotError('Network error updating password.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.brandTitle}>KIET SMART CARE</Text>
            <Text style={styles.title}>Student Portal</Text>
            <Text style={styles.subtext}>
              Sign in using your institutional roll number and password.
            </Text>
          </View>

          {/* Success Notification */}
          {successMessage && (
            <View style={styles.successBox}>
              <CheckCircle2 size={16} color="#059669" />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}

          {/* Error Notification */}
          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {isFirstLoginChange ? (
            /* First Login: Force Set New Password */
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password</Text>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor="#999999"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#999999"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handlePasswordChange}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Set Password & Continue</Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* Standard Login Form */
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Roll Number</Text>
                <TextInput
                  style={styles.input}
                  value={rollNumber}
                  onChangeText={(t) => setRollNumber(t.toUpperCase())}
                  placeholder="e.g. 2400290129999"
                  placeholderTextColor="#999999"
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                  placeholderTextColor="#999999"
                  secureTextEntry
                  autoCapitalize="none"
                />
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Sign In</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.forgotBtn}
                onPress={openForgotModal}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotBtnText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Clean Small Reminder Text at the bottom */}
          <View style={styles.reminderFootnote}>
            <Text style={styles.reminderFootnoteText}>
              First-time sign-in? Your default password is your institutional Roll Number.
            </Text>
          </View>

          {/* Larger Wobnimo Mascot at the bottom */}
          <View style={styles.mascotContainer}>
            <WobnimoMascot character="boo" state={mascotState} size={170} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal visible={isForgotModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderIcon}>
                <KeyRound size={20} color="#0284C7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Reset Password</Text>
                <Text style={styles.modalSub}>Verify your student account to create a new password</Text>
              </View>
              <TouchableOpacity onPress={() => setIsForgotModalOpen(false)}>
                <X size={20} color="#666666" />
              </TouchableOpacity>
            </View>

            {forgotError && (
              <View style={styles.modalErrorBox}>
                <Text style={styles.modalErrorText}>{forgotError}</Text>
              </View>
            )}

            {forgotStep === 'verify' ? (
              <View style={styles.modalForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Student Roll Number</Text>
                  <TextInput
                    style={styles.input}
                    value={forgotRoll}
                    onChangeText={(t) => setForgotRoll(t.toUpperCase())}
                    placeholder="e.g. 2400290129999"
                    autoCapitalize="characters"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Registered Phone Number</Text>
                  <TextInput
                    style={styles.input}
                    value={forgotPhone}
                    onChangeText={setForgotPhone}
                    placeholder="e.g. 9876543210"
                    keyboardType="phone-pad"
                  />
                </View>

                <TouchableOpacity
                  style={styles.modalSubmitBtn}
                  onPress={handleVerifyIdentity}
                  disabled={isForgotLoading}
                  activeOpacity={0.8}
                >
                  {isForgotLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalSubmitBtnText}>Verify Identity</Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.modalForm}>
                <View style={styles.identitySuccessBadge}>
                  <CheckCircle2 size={16} color="#059669" />
                  <Text style={styles.identitySuccessText}>Verified for {verifiedStudentName}</Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>New Password</Text>
                  <TextInput
                    style={styles.input}
                    value={resetNewPass}
                    onChangeText={setResetNewPass}
                    placeholder="Minimum 6 characters"
                    secureTextEntry
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Confirm New Password</Text>
                  <TextInput
                    style={styles.input}
                    value={resetConfirmPass}
                    onChangeText={setResetConfirmPass}
                    placeholder="Re-enter new password"
                    secureTextEntry
                  />
                </View>

                <TouchableOpacity
                  style={styles.modalSubmitBtn}
                  onPress={handleResetPassword}
                  disabled={isForgotLoading}
                  activeOpacity={0.8}
                >
                  {isForgotLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.modalSubmitBtnText}>Save New Password</Text>
                  )}
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
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 32,
    paddingTop: 50,
    paddingBottom: 20,
    justifyContent: 'center',
    flexGrow: 1,
  },
  header: {
    marginBottom: 26,
  },
  brandTitle: {
    fontSize: 12,
    letterSpacing: 1,
    fontWeight: '700',
    color: '#0284C7',
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#121212',
    letterSpacing: -0.4,
  },
  subtext: {
    fontSize: 13,
    color: '#555555',
    marginTop: 6,
    lineHeight: 18,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 18,
  },
  successText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
  errorBox: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    marginBottom: 18,
  },
  errorText: {
    fontSize: 12,
    color: '#991B1B',
  },
  form: {
    gap: 15,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#121212',
  },
  input: {
    height: 52,
    borderWidth: 1,
    borderColor: '#EBEBEB',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    color: '#121212',
    backgroundColor: '#FAFAFA',
  },
  submitBtn: {
    marginTop: 6,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#0A0A0A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  forgotBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  forgotBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
  },
  reminderFootnote: {
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  reminderFootnoteText: {
    fontSize: 11,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 16,
  },
  mascotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    height: 180,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  modalHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F9FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#121212',
  },
  modalSub: {
    fontSize: 12,
    color: '#555555',
    marginTop: 2,
    lineHeight: 16,
  },
  modalErrorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  modalErrorText: {
    fontSize: 12,
    color: '#991B1B',
  },
  modalForm: {
    gap: 14,
  },
  modalSubmitBtn: {
    backgroundColor: '#0284C7',
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  modalSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  identitySuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    padding: 10,
  },
  identitySuccessText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#065F46',
  },
});
