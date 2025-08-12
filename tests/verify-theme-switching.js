/**
 * Theme Switching Verification Script
 * Quick verification that theme switching functionality works
 */

// Simple verification function that can be run in browser console
function verifyThemeSwitching() {
    console.log('🔍 Verifying Theme Switching Functionality...');
    
    // Check if ThemeManager exists
    if (typeof ThemeManager === 'undefined') {
        console.error('❌ ThemeManager not found');
        return false;
    }
    
    // Initialize theme manager
    const themeManager = new ThemeManager();
    const initResult = themeManager.initializeThemeSystem();
    
    if (!initResult) {
        console.error('❌ Theme system failed to initialize');
        return false;
    }
    
    console.log('✅ Theme system initialized');
    
    // Test all themes
    const themes = ['white', 'dark', 'student', 'developer', 'professional'];
    let allThemesWork = true;
    
    themes.forEach(theme => {
        const result = themeManager.setTheme(theme);
        const current = themeManager.getCurrentTheme();
        
        if (result && current === theme) {
            console.log(`✅ ${theme} theme: PASS`);
        } else {
            console.error(`❌ ${theme} theme: FAIL (result: ${result}, current: ${current})`);
            allThemesWork = false;
        }
    });
    
    // Test persistence
    const testTheme = 'dark';
    const saveResult = themeManager.saveThemePreference(testTheme);
    const loadResult = themeManager.loadThemePreference();
    
    if (saveResult && loadResult === testTheme) {
        console.log('✅ Theme persistence: PASS');
    } else {
        console.error(`❌ Theme persistence: FAIL (save: ${saveResult}, load: ${loadResult})`);
        allThemesWork = false;
    }
    
    // Test UI elements
    const themeSelector = document.querySelector('.theme-selector');
    const themeToggle = document.getElementById('themeToggle');
    const themeDropdown = document.getElementById('themeDropdown');
    
    if (themeSelector && themeToggle && themeDropdown) {
        console.log('✅ Theme UI elements: PASS');
    } else {
        console.error('❌ Theme UI elements: FAIL');
        allThemesWork = false;
    }
    
    if (allThemesWork) {
        console.log('🎉 All theme switching functionality verified successfully!');
        return true;
    } else {
        console.error('⚠️ Some theme functionality issues detected');
        return false;
    }
}

// Export for use
if (typeof window !== 'undefined') {
    window.verifyThemeSwitching = verifyThemeSwitching;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { verifyThemeSwitching };
}