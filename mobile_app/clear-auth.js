// Run this script to clear all auth data from the app
// Usage: node clear-auth.js

const { execSync } = require('child_process');

console.log('Clearing authentication data...');

try {
    // For iOS Simulator
    execSync('xcrun simctl privacy booted reset all com.anonymous.mobileapp', { stdio: 'inherit' });
    console.log('✓ Cleared iOS Simulator data');
} catch (e) {
    console.log('- iOS Simulator not running or not available');
}

try {
    // For Android Emulator
    execSync('adb shell pm clear com.anonymous.mobileapp', { stdio: 'inherit' });
    console.log('✓ Cleared Android Emulator data');
} catch (e) {
    console.log('- Android Emulator not running or not available');
}

console.log('\nAuth data cleared! Restart the app to see login screen.');
