import { PinAuthService } from '../../apps/web/lib/auth/pin-service';

async function runPinAuthTests() {
  console.log('=====================================================');
  console.log('KIET SMART CARE - ROLE PIN AUTHENTICATION TEST SUITE');
  console.log('=====================================================');

  const testIp = `192.168.1.${Math.floor(Math.random() * 200) + 50}`;

  // Test 1: Doctor Valid PIN
  console.log('\n--- 1. Valid Doctor PIN Verification ---');
  const docResult = await PinAuthService.verifyPin('doctor', '00000', testIp);
  if (docResult.success && docResult.token && docResult.user?.role === 'doctor') {
    console.log('✔ PASS: Doctor PIN 00000 verified successfully');
  } else {
    throw new Error(`Doctor verification failed: ${JSON.stringify(docResult)}`);
  }

  // Test 2: Officer Valid PIN
  console.log('\n--- 2. Valid Officer PIN Verification ---');
  const officerResult = await PinAuthService.verifyPin('officer', '00000', testIp);
  if (officerResult.success && officerResult.token && officerResult.user?.role === 'officer') {
    console.log('✔ PASS: Officer PIN 00000 verified successfully');
  } else {
    throw new Error(`Officer verification failed: ${JSON.stringify(officerResult)}`);
  }

  // Test 3: Admin 8-digit PIN
  console.log('\n--- 3. Valid Admin 8-digit PIN Verification ---');
  const adminResult = await PinAuthService.verifyPin('admin', '31012005', testIp);
  if (adminResult.success && adminResult.token && adminResult.user?.role === 'admin') {
    console.log('✔ PASS: Admin 8-digit PIN 31012005 verified successfully');
  } else {
    throw new Error(`Admin verification failed: ${JSON.stringify(adminResult)}`);
  }

  // Test 4: Session Token Validation
  console.log('\n--- 4. Session Token Signing & Verification ---');
  const verifiedSession = PinAuthService.verifySessionToken(docResult.token!);
  if (verifiedSession && verifiedSession.role === 'doctor') {
    console.log('✔ PASS: Session token signature and payload verified (Role: doctor)');
  } else {
    throw new Error('Session token verification failed');
  }

  // Test 5: Rate Limiting and Lockout on 5 Failed Attempts
  console.log('\n--- 5. Rate Limiting: 5 Failed Attempts Lockout ---');
  const attackIp = `10.0.0.${Math.floor(Math.random() * 250) + 1}`;
  for (let i = 1; i <= 4; i++) {
    const failRes = await PinAuthService.verifyPin('doctor', '99999', attackIp);
    if (!failRes.success && failRes.remainingAttempts !== undefined) {
      console.log(`✔ Attempt ${i} rejected. Remaining: ${failRes.remainingAttempts}`);
    }
  }

  // 5th attempt should trigger lockout
  const lockoutRes = await PinAuthService.verifyPin('doctor', '99999', attackIp);
  if (!lockoutRes.success && lockoutRes.lockedOut) {
    console.log(`✔ PASS: 5th failed attempt triggered lockout for ${lockoutRes.remainingMinutes} minutes`);
  } else {
    throw new Error(`Lockout did not trigger on 5th attempt: ${JSON.stringify(lockoutRes)}`);
  }

  // 6th attempt while locked should reject immediately
  const blockedRes = await PinAuthService.verifyPin('doctor', '00000', attackIp);
  if (!blockedRes.success && blockedRes.lockedOut) {
    console.log('✔ PASS: Even correct PIN rejected during 15-minute lockout period');
  } else {
    throw new Error('Lockout was bypassed with correct PIN');
  }

  // Test 6: 5-digit PIN Generation
  console.log('\n--- 6. Random 5-digit PIN Generator ---');
  const generatedPin = await PinAuthService.generateUniqueFiveDigitPin('doctor');
  if (/^\d{5}$/.test(generatedPin)) {
    console.log(`✔ PASS: Generated valid 5-digit PIN: ${generatedPin}`);
  } else {
    throw new Error(`Generated PIN invalid: ${generatedPin}`);
  }

  console.log('\n=====================================================');
  console.log('ALL ROLE PIN AUTHENTICATION TESTS PASSED!');
  console.log('=====================================================');
}

runPinAuthTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

