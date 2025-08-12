// Integration validation script
// Tests that theme manager integrates correctly with main application

function validateIntegration() {
    console.log('=== Theme Manager Integration Validation ===');
    
    // Check if theme manager is available
    if (typeof themeManager === 'undefined') {
        console.error('❌ Theme manager not available');
        return false;
    }
    console.log('✅ Theme manager available');
    
    // Check if theme manager is initialized
    const status = themeManager.getStatus();
    if (!status.initialized) {
        console.error('❌ Theme manager not initialized');
        return false;
    }
    console.log('✅ Theme manager initialized');
    
    // Check if utility functions are available
    if (typeof window.themeUtils === 'undefined') {
        console.error('❌ Theme utilities not available');
        return false;
    }
    console.log('✅ Theme utilities available');
    
    // Test basic functionality
    try {
        const currentTheme = themeManager.getCurrentTheme();
        console.log(`✅ Current theme: ${currentTheme}`);
        
        const availableThemes = themeManager.getAvailableThemes();
        console.log(`✅ Available themes: ${availableThemes.length}`);
        
        // Test theme switching
        const testTheme = currentTheme === 'white' ? 'dark' : 'white';
        const switchResult = themeManager.setTheme(testTheme);
        if (switchResult) {
            console.log(`✅ Successfully switched to ${testTheme}`);
            
            // Switch back
            themeManager.setTheme(currentTheme);
            console.log(`✅ Successfully switched back to ${currentTheme}`);
        } else {
            console.error('❌ Failed to switch themes');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Error testing functionality:', error);
        return false;
    }
    
    console.log('🎉 Integration validation PASSED!');
    return true;
}

// Auto-run validation when loaded
if (typeof window !== 'undefined') {
    window.validateIntegration = validateIntegration;
    
    // Run validation after a short delay to ensure everything is loaded
    setTimeout(() => {
        if (typeof themeManager !== 'undefined') {
            validateIntegration();
        } else {
            console.error('Theme manager not loaded, skipping validation');
        }
    }, 100);
}