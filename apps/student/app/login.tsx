import React, { useState } from 'react';
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

  const handleLogin = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!rollNumber.trim()) {
      setErrorMessage('Please enter your student Roll Number.');
      return;
    }
    if (!password) {
      setErrorMessage('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await AuthService.login(rollNumber, password);
      if (!result.success) {
        setErrorMessage(result.error || 'Invalid roll number or password.');
        return;
      }

      if (result.session?.is_first_login) {
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
    if (newPassword.length < 8) {
      setErrorMessage('New password must be at least 8 characters.');
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
    setForgotRoll(rollNumber.trim());
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
          roll_number: forgotRoll.trim(),
          phone: forgotPhone.trim(),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setForgotError(data.error || 'Verification failed. Please check your details.');
        return;
      }

      setVerifiedStudentName(data.studentName || 'Student');
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
    if (resetNewPass.length < 8) {
      setForgotError('Password must be at least 8 characters long.');
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
          action: 'reset',
          roll_number: forgotRoll.trim(),
          phone: forgotPhone.trim(),
          new_password: resetNewPass,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        setForgotError(data.error || 'Failed to update password.');
        return;
      }

      // Success: close modal and set prefilled roll
      setIsForgotModalOpen(false);
      setRollNumber(forgotRoll.trim());
      setPassword('');
      setSuccessMessage(
        `Password reset successfully for ${verifiedStudentName}! Please sign in with your new password.`
      );
    } catch {
      setForgotError('Network error resetting password.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.brandTitle}>KIET SMART CARE</Text>
            <Text style={styles.title}>Student Portal</Text>
            <Text style={styles.subtext}>
              {isFirstLoginChange
                ? 'Create a secure personal password for your mobile health account.'
                : 'Sign in using your institutional roll number and password.'}
            </Text>
          </View>

          {/* Success Notification */}
          {successMessage && (
            <View style={styles.successBox}>
              <CheckCircle2 size={16} color="#059669" />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}

          {/* Error Banner */}
          {errorMessage && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Form */}
          {!isFirstLoginChange ? (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Roll Number</Text>
                <TextInput
                  style={styles.input}
                  value={rollNumber}
                  onChangeText={setRollNumber}
                  placeholder="e.g. 2400290129999"
                  autoCapitalize="none"
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
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.submitBtnText}>
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.forgotBtn}
                onPress={openForgotModal}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotBtnText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password</Text>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="At least 8 characters"
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter new password"
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handlePasswordChange}
                disabled={isLoading}
                activeOpacity={0.8}
              >
                <Text style={styles.submitBtnText}>
                  {isLoading ? 'Updating...' : 'Set Password and Continue'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Forgot Password Modal */}
      <Modal
        visible={isForgotModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsForgotModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderIcon}>
                <KeyRound size={20} color="#0284C7" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Reset Password</Text>
                <Text style={styles.modalSub}>
                  {forgotStep === 'verify'
                    ? 'Verify identity with your roll number & registered phone.'
                    : `Welcome ${verifiedStudentName}. Set a new secure password.`}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsForgotModalOpen(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {/* Modal Error */}
            {forgotError && (
              <View style={styles.modalErrorBox}>
                <Text style={styles.modalErrorText}>{forgotError}</Text>
              </View>
            )}

            {/* Step 1: Verification */}
            {forgotStep === 'verify' ? (
              <View style={styles.modalForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Student Roll Number</Text>
                  <TextInput
                    style={styles.input}
                    value={forgotRoll}
                    onChangeText={setForgotRoll}
                    placeholder="e.g. 2400290129999"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Registered Mobile Number</Text>
                  <TextInput
                    style={styles.input}
                    value={forgotPhone}
                    onChangeText={setForgotPhone}
                    placeholder="10-digit mobile number"
                    keyboardType="phone-pad"
                  />
                  <Text style={styles.helperText}>
                    Matches the phone number registered with campus clinic
                  </Text>
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
              /* Step 2: New Password */
              <View style={styles.modalForm}>
                <View style={styles.identitySuccessBadge}>
                  <ShieldCheck size={16} color="#059669" />
                  <Text style={styles.identitySuccessText}>
                    Verified: {verifiedStudentName} ({forgotRoll})
                  </Text>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>New Password</Text>
                  <TextInput
                    style={styles.input}
                    value={resetNewPass}
                    onChangeText={setResetNewPass}
                    placeholder="Minimum 8 characters"
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
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 28,
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
    marginBottom: 20,
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
    marginBottom: 20,
  },
  errorText: {
    fontSize: 12,
    color: '#991B1B',
  },
  form: {
    gap: 16,
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
  helperText: {
    fontSize: 11,
    color: '#666666',
  },
  submitBtn: {
    marginTop: 8,
    height: 54,
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
    paddingVertical: 12,
  },
  forgotBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0284C7',
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
