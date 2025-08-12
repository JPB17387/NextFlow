/**
 * Theme Dropdown Accessibility Validation Script
 * Validates all accessibility requirements for task 5
 * 
 * Requirements tested:
 * 5.1 - Focus remains within dropdown during positioning changes
 * 5.2 - Keyboard navigation functionality regardless of position  
 * 5.3 - ARIA live region announcements for significant positioning changes
 * 5.4 - Screen reader compatibility with dynamic positioning
 * 5.5 - Proper focus management and accessibility features
 */

class ThemeDropdownAccessibilityValidator {
    constructor() {
        this.testResults = {
            overall: false,
            requirements: {},
            details: [],
            errors: []
        };
    }

    /**
     * Run all accessibility validation tests
     * @returns {Object} - Complete test results
     */
    async validateAll() {
        console.log('Starting Theme Dropdown Accessibility Validation...');
        
        try {
            // Test Requirement 5.1 - Focus management during positioning
            this.testResults.requirements['5.1'] = await this.testFocusDuringPositioning();
            
            // Test Requirement 5.2 - Keyboard navigation regardless of position
            this.testResults.requirements['5.2'] = await this.testKeyboardNavigationPositioning();
            
            // Test Requirement 5.3 - ARIA live region announcements
            this.testResults.requirements['5.3'] = await this.testAriaLiveAnnouncements();
            
            // Test Requirement 5.4 - Screen reader compatibility
            this.testResults.requirements['5.4'] = await this.testScreenReaderCompatibility();
            
            // Test Requirement 5.5 - Overall accessibility features
            this.testResults.requirements['5.5'] = await this.testOverallAccessibility();
            
            // Calculate overall result
            const passedRequirements = Object.values(this.testResults.requirements).filter(result => result.passed).length;
            const totalRequirements = Object.keys(this.testResults.requirements).length;
            this.testResults.overall = passedRequirements === totalRequirements;
            
            // Generate summary
            this.generateSummary();
            
            return this.testResults;
            
        } catch (error) {
            this.testResults.errors.push(`Validation failed: ${error.message}`);
            console.error('Accessibility validation error:', error);
            return this.testResults;
        }
    }

    /**
     * Test Requirement 5.1 - Focus remains within dropdown during positioning changes
     */
    async testFocusDuringPositioning() {
        const result = { passed: false, details: [], errors: [] };
        
        try {
            const dropdown = document.getElementById('themeDropdown');
            const toggle = document.getElementById('themeToggle');
            
            if (!dropdown || !toggle) {
                result.errors.push('Theme dropdown elements not found');
                return result;
            }
            
            // Open dropdown
            toggle.click();
            await this.wait(100);
            
            const initialFocus = document.activeElement;
            const focusInDropdown = dropdown.contains(initialFocus);
            
            if (!focusInDropdown) {
                result.errors.push('Focus not in dropdown after opening');
                return result;
            }
            
            result.details.push('✓ Focus correctly placed in dropdown on open');
            
            // Test positioning changes
            const positioningClasses = ['position-left', 'position-center', 'position-offset-left'];
            let allPositioningTestsPassed = true;
            
            for (const className of positioningClasses) {
                dropdown.classList.add(className);
                
                // Trigger focus maintenance
                maintainDropdownFocus(dropdown, initialFocus);
                await this.wait(100);
                
                const focusAfterPositioning = document.activeElement;
                const focusMaintained = dropdown.contains(focusAfterPositioning);
                
                if (!focusMaintained) {
                    result.errors.push(`Focus lost during ${className} positioning`);
                    allPositioningTestsPassed = false;
                } else {
                    result.details.push(`✓ Focus maintained during ${className} positioning`);
                }
                
                dropdown.classList.remove(className);
            }
            
            // Close dropdown and test focus restoration
            closeThemeDropdown();
            await this.wait(100);
            
            const focusAfterClose = document.activeElement;
            const focusRestored = focusAfterClose === toggle;
            
            if (!focusRestored) {
                result.errors.push('Focus not restored to toggle after closing');
                allPositioningTestsPassed = false;
            } else {
                result.details.push('✓ Focus correctly restored to toggle after closing');
            }
            
            result.passed = allPositioningTestsPassed;
            
        } catch (error) {
            result.errors.push(`Focus positioning test error: ${error.message}`);
        }
        
        return result;
    }

    /**
     * Test Requirement 5.2 - Keyboard navigation functionality regardless of position
     */
    async testKeyboardNavigationPositioning() {
        const result = { passed: false, details: [], errors: [] };
        
        try {
            const dropdown = document.getElementById('themeDropdown');
            const toggle = document.getElementById('themeToggle');
            const options = dropdown.querySelectorAll('.theme-option');
            
            if (!dropdown || !toggle || options.length === 0) {
                result.errors.push('Required elements not found for keyboard navigation test');
                return result;
            }
            
            // Test keyboard navigation setup
            const hasProperTabindex = Array.from(options).some(option => 
                option.getAttribute('tabindex') === '0'
            );
            
            if (!hasProperTabindex) {
                result.errors.push('Options do not have proper tabindex setup');
                return result;
            }
            
            result.details.push('✓ Proper tabindex management detected');
            
            // Test ARIA attributes
            const hasProperAria = dropdown.getAttribute('role') === 'listbox' &&
                                 dropdown.hasAttribute('aria-describedby');
            
            if (!hasProperAria) {
                result.errors.push('Missing required ARIA attributes for keyboard navigation');
                return result;
            }
            
            result.details.push('✓ Proper ARIA attributes for keyboard navigation');
            
            // Open dropdown and test navigation with positioning
            toggle.click();
            await this.wait(100);
            
            let keyboardTestsPassed = true;
            const positioningClasses = ['position-left', 'position-center'];
            
            for (const className of positioningClasses) {
                dropdown.classList.add(className);
                
                // Test arrow key navigation
                const firstOption = options[0];
                firstOption.focus();
                
                // Simulate arrow down
                const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
                firstOption.dispatchEvent(arrowDownEvent);
                await this.wait(50);
                
                const focusAfterArrow = document.activeElement;
                const navigationWorked = dropdown.contains(focusAfterArrow) && focusAfterArrow !== firstOption;
                
                if (!navigationWorked) {
                    result.errors.push(`Arrow key navigation failed with ${className}`);
                    keyboardTestsPassed = false;
                } else {
                    result.details.push(`✓ Arrow key navigation works with ${className}`);
                }
                
                dropdown.classList.remove(className);
            }
            
            closeThemeDropdown();
            result.passed = keyboardTestsPassed;
            
        } catch (error) {
            result.errors.push(`Keyboard navigation test error: ${error.message}`);
        }
        
        return result;
    }

    /**
     * Test Requirement 5.3 - ARIA live region announcements for significant positioning changes
     */
    async testAriaLiveAnnouncements() {
        const result = { passed: false, details: [], errors: [] };
        
        try {
            // Test live region creation
            const liveRegion = getOrCreateAriaLiveRegion();
            
            if (!liveRegion) {
                result.errors.push('ARIA live region not created');
                return result;
            }
            
            result.details.push('✓ ARIA live region exists');
            
            // Test live region attributes
            const hasProperAttributes = liveRegion.getAttribute('aria-live') === 'polite' &&
                                       liveRegion.getAttribute('aria-atomic') === 'true' &&
                                       liveRegion.className.includes('sr-only');
            
            if (!hasProperAttributes) {
                result.errors.push('Live region missing proper attributes');
                return result;
            }
            
            result.details.push('✓ Live region has proper attributes');
            
            // Test positioning announcements
            const originalContent = liveRegion.textContent;
            
            announcePositioningChange({
                positionChanged: true,
                strategy: 'collision-avoided',
                significantChange: true
            });
            
            await this.wait(200);
            
            const announcementMade = liveRegion.textContent !== originalContent && 
                                   liveRegion.textContent.length > 0;
            
            if (!announcementMade) {
                result.errors.push('Positioning announcement not made to live region');
                return result;
            }
            
            result.details.push('✓ Positioning announcements working');
            
            // Test different announcement strategies
            const strategies = ['left-aligned', 'center-aligned', 'viewport-adjusted'];
            let allAnnouncementsWork = true;
            
            for (const strategy of strategies) {
                const beforeContent = liveRegion.textContent;
                
                announcePositioningChange({
                    positionChanged: true,
                    strategy: strategy,
                    significantChange: true
                });
                
                await this.wait(200);
                
                const afterContent = liveRegion.textContent;
                const strategyAnnouncementMade = afterContent !== beforeContent;
                
                if (!strategyAnnouncementMade) {
                    result.errors.push(`${strategy} announcement not made`);
                    allAnnouncementsWork = false;
                } else {
                    result.details.push(`✓ ${strategy} announcement working`);
                }
            }
            
            result.passed = allAnnouncementsWork;
            
        } catch (error) {
            result.errors.push(`ARIA live announcements test error: ${error.message}`);
        }
        
        return result;
    }

    /**
     * Test Requirement 5.4 - Screen reader compatibility with dynamic positioning
     */
    async testScreenReaderCompatibility() {
        const result = { passed: false, details: [], errors: [] };
        
        try {
            // Use the existing comprehensive screen reader test
            const screenReaderResults = testScreenReaderCompatibility();
            
            if (!screenReaderResults) {
                result.errors.push('Screen reader compatibility test failed to run');
                return result;
            }
            
            // Check overall compatibility
            if (!screenReaderResults.overall) {
                result.errors.push('Screen reader compatibility test failed overall');
                result.details.push(`Pass rate: ${screenReaderResults.passRate || 0}%`);
                
                if (screenReaderResults.recommendations) {
                    result.errors.push(...screenReaderResults.recommendations);
                }
                
                return result;
            }
            
            result.details.push('✓ Screen reader compatibility test passed');
            result.details.push(`Pass rate: ${screenReaderResults.passRate}%`);
            
            // Check specific dynamic positioning compatibility
            const dynamicPositioningTest = testDynamicPositioningAccessibility(
                document.getElementById('themeDropdown')
            );
            
            if (!dynamicPositioningTest) {
                result.errors.push('Dynamic positioning accessibility test failed');
                return result;
            }
            
            result.details.push('✓ Dynamic positioning accessibility test passed');
            result.passed = true;
            
        } catch (error) {
            result.errors.push(`Screen reader compatibility test error: ${error.message}`);
        }
        
        return result;
    }

    /**
     * Test Requirement 5.5 - Overall accessibility features
     */
    async testOverallAccessibility() {
        const result = { passed: false, details: [], errors: [] };
        
        try {
            const dropdown = document.getElementById('themeDropdown');
            const toggle = document.getElementById('themeToggle');
            const options = dropdown.querySelectorAll('.theme-option');
            
            if (!dropdown || !toggle || options.length === 0) {
                result.errors.push('Required elements not found');
                return result;
            }
            
            let overallTestsPassed = true;
            
            // Test 1: Focus trap functionality
            setupFocusTrap(dropdown);
            const hasFocusTrap = dropdown._focusTrapHandler !== null;
            
            if (!hasFocusTrap) {
                result.errors.push('Focus trap not properly set up');
                overallTestsPassed = false;
            } else {
                result.details.push('✓ Focus trap functionality working');
            }
            
            // Test 2: Enhanced keyboard navigation
            setupEnhancedKeyboardNavigation(dropdown);
            const hasEnhancedNav = dropdown.hasAttribute('aria-describedby') &&
                                  Array.from(options).every(option => option.hasAttribute('role'));
            
            if (!hasEnhancedNav) {
                result.errors.push('Enhanced keyboard navigation not properly set up');
                overallTestsPassed = false;
            } else {
                result.details.push('✓ Enhanced keyboard navigation working');
            }
            
            // Test 3: Accessibility announcements
            const generalLiveRegion = document.getElementById('accessibility-announcements') ||
                                    getOrCreateAriaLiveRegion();
            
            if (!generalLiveRegion) {
                result.errors.push('General accessibility announcements not available');
                overallTestsPassed = false;
            } else {
                result.details.push('✓ General accessibility announcements available');
            }
            
            // Test 4: Option descriptions and context
            const optionsHaveContext = Array.from(options).every(option => {
                return option.id && 
                       option.querySelector('.theme-name') &&
                       option.hasAttribute('aria-selected');
            });
            
            if (!optionsHaveContext) {
                result.errors.push('Theme options missing proper context and descriptions');
                overallTestsPassed = false;
            } else {
                result.details.push('✓ Theme options have proper context and descriptions');
            }
            
            // Cleanup
            removeFocusTrap(dropdown);
            
            result.passed = overallTestsPassed;
            
        } catch (error) {
            result.errors.push(`Overall accessibility test error: ${error.message}`);
        }
        
        return result;
    }

    /**
     * Generate summary of all test results
     */
    generateSummary() {
        const passedCount = Object.values(this.testResults.requirements).filter(r => r.passed).length;
        const totalCount = Object.keys(this.testResults.requirements).length;
        
        this.testResults.summary = {
            passed: passedCount,
            total: totalCount,
            passRate: Math.round((passedCount / totalCount) * 100),
            overall: this.testResults.overall
        };
        
        console.log(`\n=== THEME DROPDOWN ACCESSIBILITY VALIDATION SUMMARY ===`);
        console.log(`Overall Result: ${this.testResults.overall ? 'PASS' : 'FAIL'}`);
        console.log(`Requirements Passed: ${passedCount}/${totalCount} (${this.testResults.summary.passRate}%)`);
        
        Object.entries(this.testResults.requirements).forEach(([req, result]) => {
            console.log(`\nRequirement ${req}: ${result.passed ? 'PASS' : 'FAIL'}`);
            if (result.details.length > 0) {
                result.details.forEach(detail => console.log(`  ${detail}`));
            }
            if (result.errors.length > 0) {
                result.errors.forEach(error => console.log(`  ❌ ${error}`));
            }
        });
        
        if (this.testResults.errors.length > 0) {
            console.log(`\nGeneral Errors:`);
            this.testResults.errors.forEach(error => console.log(`  ❌ ${error}`));
        }
    }

    /**
     * Utility function to wait for a specified time
     * @param {number} ms - Milliseconds to wait
     */
    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export for use in tests
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeDropdownAccessibilityValidator;
}

// Auto-run validation if script is loaded directly
if (typeof window !== 'undefined' && window.document) {
    window.ThemeDropdownAccessibilityValidator = ThemeDropdownAccessibilityValidator;
    
    // Provide global function to run validation
    window.validateThemeDropdownAccessibility = async function() {
        const validator = new ThemeDropdownAccessibilityValidator();
        return await validator.validateAll();
    };
}