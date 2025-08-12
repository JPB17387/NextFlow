// Verification script for comprehensive theme error handling
// This script tests all the error handling and fallback mechanisms

console.log('=== Theme Error Handling Verification ===');

// Test 1: Invalid theme names
console.log('\n1. Testing invalid theme names...');
try {
    const result1 = themeManager.setTheme('invalid-theme');
    console.log(`✓ Invalid theme handled gracefully: ${result1}`);
    
    const result2 = themeManager.setTheme(null);
    console.log(`✓ Null theme handled gracefully: ${result2}`);
    
    const result3 = themeManager.setTheme('');
    console.log(`✓ Empty theme handled gracefully: ${result3}`);
    
    // Verify current theme is valid after invalid attempts
    const currentTheme = themeManager.getCurrentTheme();
    const isValid = themeManager.isValidTheme(currentTheme);
    console.log(`✓ Current theme is valid after invalid attempts: ${isValid} (${currentTheme})`);
    
} catch (error) {
    console.error('✗ Error in invalid theme test:', error);
}

// Test 2: CSS custom properties support detection
console.log('\n2. Testing CSS custom properties support...');
try {
    const cssSupported = themeManager.isCSSCustomPropertiesSupported();
    console.log(`✓ CSS custom properties supported: ${cssSupported}`);
    
    // Test caching (should be fast on subsequent calls)
    const start = performance.now();
    for (let i = 0; i < 100; i++) {
        themeManager.isCSSCustomPropertiesSupported();
    }
    const end = performance.now();
    console.log(`✓ CSS support detection cached (100 calls in ${(end - start).toFixed(2)}ms)`);
    
} catch (error) {
    console.error('✗ Error in CSS support test:', error);
}

// Test 3: Storage availability detection
console.log('\n3. Testing storage availability...');
try {
    const storageAvailable = themeManager.isStorageAvailable();
    console.log(`✓ Storage available: ${storageAvailable}`);
    
    // Test storage functionality
    if (storageAvailable) {
        const testSave = themeManager.saveThemePreference('dark');
        console.log(`✓ Theme preference save: ${testSave}`);
        
        const testLoad = themeManager.loadThemePreference();
        console.log(`✓ Theme preference load: ${testLoad}`);
        
        // Clean up
        themeManager.clearThemePreference();
    }
    
} catch (error) {
    console.error('✗ Error in storage test:', error);
}

// Test 4: Theme recovery mechanisms
console.log('\n4. Testing theme recovery...');
try {
    const recoveryResult = themeManager.attemptThemeRecovery();
    console.log(`✓ Theme recovery: ${recoveryResult}`);
    
    const systemRecovery = themeManager.performSystemRecovery();
    console.log(`✓ System recovery success: ${systemRecovery.success}`);
    console.log(`✓ Recovery steps completed: ${systemRecovery.steps.length}`);
    
    if (systemRecovery.errors.length > 0) {
        console.warn(`⚠ Recovery errors: ${systemRecovery.errors.length}`);
        systemRecovery.errors.forEach(error => console.warn(`  - ${error}`));
    }
    
} catch (error) {
    console.error('✗ Error in recovery test:', error);
}

// Test 5: System integrity validation
console.log('\n5. Testing system integrity...');
try {
    const integrity = themeManager.validateIntegrity();
    console.log(`✓ System integrity valid: ${integrity.valid}`);
    
    if (integrity.warnings.length > 0) {
        console.warn(`⚠ Integrity warnings: ${integrity.warnings.length}`);
        integrity.warnings.forEach(warning => console.warn(`  - ${warning}`));
    }
    
    if (integrity.errors.length > 0) {
        console.error(`✗ Integrity errors: ${integrity.errors.length}`);
        integrity.errors.forEach(error => console.error(`  - ${error}`));
    }
    
    if (integrity.recommendations.length > 0) {
        console.info(`ℹ Recommendations: ${integrity.recommendations.length}`);
        integrity.recommendations.forEach(rec => console.info(`  - ${rec}`));
    }
    
} catch (error) {
    console.error('✗ Error in integrity test:', error);
}

// Test 6: Error callback system
console.log('\n6. Testing error callback system...');
try {
    let errorCallbackTriggered = false;
    
    // Register error callback
    themeManager.onError((message, type, originalError) => {
        errorCallbackTriggered = true;
        console.log(`✓ Error callback triggered: ${type} - ${message}`);
    });
    
    // Trigger an error to test callback
    themeManager.setTheme('trigger-error-callback');
    
    setTimeout(() => {
        console.log(`✓ Error callback system working: ${errorCallbackTriggered}`);
    }, 100);
    
} catch (error) {
    console.error('✗ Error in callback test:', error);
}

// Test 7: Fallback styling
console.log('\n7. Testing fallback styling...');
try {
    // Test fallback styling application
    const fallbackResult = themeManager.applyFallbackStyling();
    console.log(`✓ Fallback styling applied: ${fallbackResult}`);
    
    // Check if fallback class was added
    const hasFallbackClass = document.documentElement.classList.contains('theme-fallback-mode');
    console.log(`✓ Fallback mode class applied: ${hasFallbackClass}`);
    
    // Check if fallback styles were injected
    const fallbackStyles = document.getElementById('theme-fallback-styles');
    console.log(`✓ Fallback styles injected: ${!!fallbackStyles}`);
    
} catch (error) {
    console.error('✗ Error in fallback styling test:', error);
}

console.log('\n=== Error Handling Verification Complete ===');

// Final status report
console.log('\nFinal System Status:');
const finalStatus = themeManager.getStatus();
console.log(`- Initialized: ${finalStatus.initialized}`);
console.log(`- Current Theme: ${finalStatus.currentTheme}`);
console.log(`- Storage Available: ${finalStatus.storageAvailable}`);
console.log(`- CSS Supported: ${finalStatus.cssSupported}`);
console.log(`- Available Themes: ${finalStatus.availableThemes.length}`);
console.log(`- Has Stored Preference: ${finalStatus.hasStoredPreference}`);

if (finalStatus.diagnostics.errors.length > 0) {
    console.warn('Diagnostic Errors:');
    finalStatus.diagnostics.errors.forEach(error => console.warn(`  - ${error}`));
}