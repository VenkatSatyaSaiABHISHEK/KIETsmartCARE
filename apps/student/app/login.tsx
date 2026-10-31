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
} from 'react-native';
import { useRouter } from 'expo-router';
import { ShieldCheck, Lock, AlertCircle, ArrowRight, KeyRound } from 'lucide-react-native';
import { AuthService } from '../src/services/auth';

export default function LoginScreen() {
  const router = useRouter();
  const [rollNumber, setRollNumber] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Forced password change state on first login
  const [isFirstLoginChange, setIsFirstLoginChange] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleLogin = async () => {
    setErrorMessage(null);
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
        // Admin issued first password -> force change on first login
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

  const handleChangeFirstPassword = async () => {
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
      const result = await AuthService.changePassword(newPassword);
      if (!result.success) {
        setErrorMessage(result.error || 'Failed to update password.');
        return;
      }
      router.replace('/consent');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Logo */}
          <View style={styles.brandContainer}>
            <View style={styles.logoBadge}>
              <ShieldCheck color="#ffffff" size={32} />
            </View>
            <Text style={styles.brandTitle}>KIET Smart Care</Text>
            <Text style={styles.brandSub}>
              Campus Healthcare & Medication Adherence
            </Text>
          </View>

          {!isFirstLoginChange ? (
            /* Standard Login Form */
            <View style={styles.formCard}>
              <Text style={styles.formTitle}>Student Sign In</Text>
              <Text style={styles.formSub}>
                Enter the credentials issued by Campus Administration.
              </Text>

              {errorMessage && (
                <View style={styles.errorBanner}>
                  <AlertCircle color="#b91c1c" size={16} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Institutional Roll Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 2200290120019"
                  placeholderTextColor="#a1a1aa"
                  value={rollNumber}
                  onChangeText={(val) => {
                    setRollNumber(val);
                    setErrorMessage(null);
                  }}
                  autoCapitalize="none"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Password</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="••••••••"
                  placeholderTextColor="#a1a1aa"
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    setErrorMessage(null);
                  }}
                  secureTextEntry
                />
                <Text style={styles.hintText}>
                  First login? Use the initial password provided by admin (e.g. kiet123).
                </Text>
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <Text style={styles.submitBtnText}>
                  {isLoading ? 'Verifying...' : 'Sign In'}
                </Text>
                <ArrowRight color="#ffffff" size={18} />
              </TouchableOpacity>
            </View>
          ) : (
            /* Force Password Change Form */
            <View style={styles.formCard}>
              <View style={styles.firstLoginPill}>
                <KeyRound color="#b45309" size={16} />
                <Text style={styles.firstLoginPillText}>First Login Security Requirement</Text>
              </View>
              <Text style={styles.formTitle}>Set Your Personal Password</Text>
              <Text style={styles.formSub}>
                For privacy and medical security, you must update the administrator-assigned password.
              </Text>

              {errorMessage && (
                <View style={styles.errorBanner}>
                  <AlertCircle color="#b91c1c" size={16} />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>New Password</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="At least 6 characters"
                  placeholderTextColor="#a1a1aa"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Confirm New Password</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Re-enter password"
                  placeholderTextColor="#a1a1aa"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleChangeFirstPassword}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                <Text style={styles.submitBtnText}>
                  {isLoading ? 'Updating...' : 'Save Password & Continue'}
                </Text>
                <ArrowRight color="#ffffff" size={18} />
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.footerNote}>
            Campus Healthcare System &bull; KIET Group of Institutions, Korangi
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 36,
    paddingBottom: 40,
    justifyContent: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoBadge: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0a0a0a',
    letterSpacing: -0.5,
  },
  brandSub: {
    fontSize: 13,
    color: '#71717a',
    marginTop: 4,
    textAlign: 'center',
  },
  formCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e4e4e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0a0a0a',
    letterSpacing: -0.4,
  },
  formSub: {
    fontSize: 13,
    color: '#71717a',
    marginTop: 4,
    lineHeight: 18,
    marginBottom: 20,
  },
  firstLoginPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    gap: 6,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  firstLoginPillText: {
    color: '#92400e',
    fontSize: 11,
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0a0a0a',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderColor: '#d4d4d8',
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#0a0a0a',
    backgroundColor: '#fafafa',
  },
  hintText: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 4,
  },
  submitBtn: {
    height: 50,
    borderRadius: 14,
    backgroundColor: '#0a0a0a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 11,
    color: '#a1a1aa',
    marginTop: 32,
  },
});
