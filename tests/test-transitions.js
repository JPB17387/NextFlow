// Test script for theme transitions
// This script tests the transition functionality

function testThemeTransitions() {
    console.log('Testing theme transitions...');
    
    // Test 1: Check if CSS transitions are applied
    const testElement = document.createElement('div');
    testElement.style.cssText = 'background-color: var(--theme-primary-bg); color: var(--theme-text-primary);';
    document.body.appendChild(testElement);
    
    const computedStyle = window.getComputedStyle(testElement);
    const transition = computedStyle.getPropertyValue('transition');
    
    console.log('Element transition property:', transition);
    
    if (transition.includes('background-color') && transition.includes('0.3s')) {
        console.log('✅ CSS transitions are properly configured');
    } else {
        console.log('❌ CSS transitions may not be working correctly');
    }
    
    document.body.removeChild(testElement);
    
    // Test 2: Check reduced motion support
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    console.log('Reduced motion preference:', reducedMotionQuery.matches ? 'enabled' : 'disabled');
    
    // Test 3: Test theme switching with timing
    if (typeof themeManager !== 'undefined') {
        console.log('Testing theme switching speed...');
        
        const startTime = performance.now();
        themeManager.setTheme('dark');
        
        // Check if theme was applied quickly (should be immediate)
        const endTime = performance.now();
        const switchTime = endTime - startTime;
        
        console.log(`Theme switch took ${switchTime.toFixed(2)}ms`);
        
        if (switchTime < 50) {
            console.log('✅ Theme switching is fast enough');
        } else {
            console.log('⚠️ Theme switching might be slow');
        }
        
        // Test form state preservation
        const testInput = document.createElement('input');
        testInput.id = 'test-input';
        testInput.value = 'test value';
        document.body.appendChild(testInput);
        testInput.focus();
        testInput.setSelectionRange(2, 6);
        
        const formState = themeManager.preserveFormState();
        console.log('Preserved form state:', formState);
        
        // Clear and restore
        testInput.value = '';
        testInput.blur();
        
        themeManager.restoreFormState(formState);
        
        if (testInput.value === 'test value' && document.activeElement === testInput) {
            console.log('✅ Form state preservation works correctly');
        } else {
            console.log('❌ Form state preservation may have issues');
        }
        
        document.body.removeChild(testInput);
        
        // Switch back to white theme
        setTimeout(() => {
            themeManager.setTheme('white');
            console.log('Theme transition test completed');
        }, 500);
        
    } else {
        console.log('❌ Theme manager not available for testing');
    }
}

// Test 4: Check for layout shifts
function testLayoutShifts() {
    console.log('Testing layout shift prevention...');
    
    const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            if (entry.entryType === 'layout-shift') {
                console.log('Layout shift detected:', entry.value);
                if (entry.value > 0.1) {
                    console.log('⚠️ Significant layout shift detected during theme change');
                } else {
                    console.log('✅ Layout shift is minimal');
                }
            }
        }
    });
    
    try {
        observer.observe({ entryTypes: ['layout-shift'] });
        console.log('Layout shift observer started');
    } catch (error) {
        console.log('Layout shift API not supported in this browser');
    }
}

// Run tests when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(testThemeTransitions, 100);
        setTimeout(testLayoutShifts, 200);
    });
} else {
    setTimeout(testThemeTransitions, 100);
    setTimeout(testLayoutShifts, 200);
}

// Export for manual testing
if (typeof window !== 'undefined') {
    window.testThemeTransitions = testThemeTransitions;
    window.testLayoutShifts = testLayoutShifts;
}