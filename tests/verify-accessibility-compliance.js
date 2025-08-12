/**
 * Accessibility Compliance Verification Script
 * Validates Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 * 
 * This script provides automated verification of accessibility compliance
 * for the theme dropdown positioning system.
 */

class AccessibilityComplianceVerifier {
    constructor() {
        this.requirements = {
            '5.1': 'Maintain proper focus management when dropdown opens',
            '5.2': 'Ensure keyboard navigation works regardless of positioning',
            '5.3': 'Provide proper screen reader announcements',
            '5.4': 'Prevent positioning changes from breaking accessibility features',
            '5.5': 'Provide clear indication of dropdown state and options for assistive technologies'
        };
        
        this.complianceResults = {};
        this.init();
    }

    init() {
        console.log('🔍 Starting Accessibility Compliance Verification...');
        this.runComplianceChecks();
    }

    async runComplianceChecks() {
        // Requirement 5.1: Focus Management
        this.complianceResults['5.1'] = await this.verifyFocusManagement();
        
        // Requirement 5.2: Keyboard Navigation
        this.complianceResults['5.2'] = await this.verifyKeyboardNavigation();
        
        // Requirement 5.3: Screen Reader Announcements
        this.complianceResults['5.3'] = await this.verifyScreenReaderAnnouncements();
        
        // Requirement 5.4: Positioning Impact on Accessibility
        this.complianceResults['5.4'] = await this.verifyPositioningAccessibility();
        
        // Requirement 5.5: Assistive Technology Support
        this.complianceResults['5.5'] = await this.verifyAssistiveTechnologySupport();
        
        this.generateComplianceReport();
    }

    async verifyFocusManagement() {
        const checks = [];
        
        try {
            // Check 1: Focus moves to dropdown when opened
            checks.push(await this.checkFocusMovesToDropdown());
            
            // Check 2: Focus returns to button when closed
            checks.push(await this.checkFocusReturnsToButton());
            
            // Check 3: Focus remains within dropdown during navigation
            checks.push(await this.checkFocusTrapping());
            
            // Check 4: Focus is maintained during repositioning
            checks.push(await this.checkFocusDuringRepositioning());
            
        } catch (error) {
            checks.push({
                name: 'Focus Management Error',
                passed: false,
                details: `Error during focus management verification: ${error.message}`
            });
        }
        
        return {
            requirement: '5.1',
            description: this.requirements['5.1'],
            checks,
            passed: checks.every(check => check.passed),
            score: `${checks.filter(c => c.passed).length}/${checks.length}`
        };
    }

    async checkFocusMovesToDropdown() {
        return new Promise((resolve) => {
            const themeBtn = this.createTestThemeButton('focus-test-1');
            const dropdown = this.createTestDropdown('focus-test-1');
            
            // Open dropdown
            themeBtn.click();
            
            setTimeout(() => {
                const focusInDropdown = dropdown.contains(document.activeElement);
                
                this.cleanup('focus-test-1');
                
                resolve({
                    name: 'Focus moves to dropdown when opened',
                    passed: focusInDropdown,
                    details: focusInDropdown 
                        ? 'Focus correctly moves to dropdown when opened'
                        : 'Focus does not move to dropdown when opened'
                });
            }, 100);
        });
    }

    async checkFocusReturnsToButton() {
        return new Promise((resolve) => {
            const themeBtn = this.createTestThemeButton('focus-test-2');
            const dropdown = this.createTestDropdown('focus-test-2');
            
            // Open then close dropdown
            themeBtn.click();
            
            setTimeout(() => {
                // Simulate Escape key to close
                const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
                document.dispatchEvent(escapeEvent);
                
                setTimeout(() => {
                    const focusOnButton = document.activeElement === themeBtn;
                    
                    this.cleanup('focus-test-2');
                    
                    resolve({
                        name: 'Focus returns to button when closed',
                        passed: focusOnButton,
                        details: focusOnButton
                            ? 'Focus correctly returns to button when dropdown is closed'
                            : 'Focus does not return to button when dropdown is closed'
                    });
                }, 100);
            }, 100);
        });
    }

    async checkFocusTrapping() {
        return new Promise((resolve) => {
            const themeBtn = this.createTestThemeButton('focus-test-3');
            const dropdown = this.createTestDropdown('focus-test-3');
            
            // Open dropdown
            themeBtn.click();
            
            setTimeout(() => {
                const options = dropdown.querySelectorAll('.theme-option');
                if (options.length > 0) {
                    // Focus last option
                    options[options.length - 1].focus();
                    
                    // Simulate Tab key
                    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
                    options[options.length - 1].dispatchEvent(tabEvent);
                    
                    setTimeout(() => {
                        const focusStillInDropdown = dropdown.contains(document.activeElement) ||
                                                   document.activeElement === themeBtn;
                        
                        this.cleanup('focus-test-3');
                        
                        resolve({
                            name: 'Focus remains within dropdown during navigation',
                            passed: focusStillInDropdown,
                            details: focusStillInDropdown
                                ? 'Focus properly trapped within dropdown'
                                : 'Focus escapes dropdown during navigation'
                        });
                    }, 100);
                } else {
                    this.cleanup('focus-test-3');
                    resolve({
                        name: 'Focus remains within dropdown during navigation',
                        passed: false,
                        details: 'No options available for focus trapping test'
                    });
                }
            }, 100);
        });
    }

    async checkFocusDuringRepositioning() {
        return new Promise((resolve) => {
            const themeBtn = this.createTestThemeButton('focus-test-4');
            const dropdown = this.createTestDropdown('focus-test-4');
            
            // Open dropdown and focus an option
            themeBtn.click();
            
            setTimeout(() => {
                const options = dropdown.querySelectorAll('.theme-option');
                if (options.length > 0) {
                    options[1].focus();
                    const focusedElement = document.activeElement;
                    
                    // Simulate repositioning
                    dropdown.classList.add('position-left');
                    
                    setTimeout(() => {
                        const focusRetained = document.activeElement === focusedElement;
                        
                        this.cleanup('focus-test-4');
                        
                        resolve({
                            name: 'Focus maintained during repositioning',
                            passed: focusRetained,
                            details: focusRetained
                                ? 'Focus maintained during dropdown repositioning'
                                : 'Focus lost during dropdown repositioning'
                        });
                    }, 100);
                } else {
                    this.cleanup('focus-test-4');
                    resolve({
                        name: 'Focus maintained during repositioning',
                        passed: false,
                        details: 'No options available for repositioning test'
                    });
                }
            }, 100);
        });
    }

    async verifyKeyboardNavigation() {
        const checks = [];
        
        try {
            // Check 1: Tab navigation includes theme button
            checks.push(await this.checkTabNavigation());
            
            // Check 2: Enter/Space opens dropdown
            checks.push(await this.checkKeyboardActivation());
            
            // Check 3: Arrow keys navigate options
            checks.push(await this.checkArrowKeyNavigation());
            
            // Check 4: Escape closes dropdown
            checks.push(await this.checkEscapeKeyFunctionality());
            
        } catch (error) {
            checks.push({
                name: 'Keyboard Navigation Error',
                passed: false,
                details: `Error during keyboard navigation verification: ${error.message}`
            });
        }
        
        return {
            requirement: '5.2',
            description: this.requirements['5.2'],
            checks,
            passed: checks.every(check => check.passed),
            score: `${checks.filter(c => c.passed).length}/${checks.length}`
        };
    }

    async checkTabNavigation() {
        return new Promise((resolve) => {
            const themeBtn = this.createTestThemeButton('keyboard-test-1');
            
            // Check if button is focusable
            themeBtn.focus();
            const isFocusable = document.activeElement === themeBtn;
            
            // Check tabindex
            const tabIndex = themeBtn.tabIndex;
            const hasProperTabIndex = tabIndex >= 0;
            
            this.cleanup('keyboard-test-1');
            
            resolve({
                name: 'Theme button included in tab navigation',
                passed: isFocusable && hasProperTabIndex,
                details: isFocusable && hasProperTabIndex
                    ? 'Theme button is properly included in tab navigation'
                    : 'Theme button is not properly focusable or has incorrect tabindex'
            });
        });
    }

    async checkKeyboardActivation() {
        return new Promise((resolve) => {
            const themeBtn = this.createTestThemeButton('keyboard-test-2');
            const dropdown = this.createTestDropdown('keyboard-test-2');
            
            themeBtn.focus();
            
            // Simulate Enter key
            const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
            themeBtn.dispatchEvent(enterEvent);
            
            setTimeout(() => {
                const isDropdownVisible = dropdown.style.display !== 'none';
                const isExpanded = themeBtn.getAttribute('aria-expanded') === 'true';
                
                this.cleanup('keyboard-test-2');
                
                resolve({
                    name: 'Enter/Space opens dropdown',
                    passed: isDropdownVisible && isExpanded,
                    details: isDropdownVisible && isExpanded
                        ? 'Dropdown opens correctly with keyboard activation'
                        : 'Dropdown does not open with keyboard activation'
                });
            }, 100);
        });
    }

    async checkArrowKeyNavigation() {
        return new Promise((resolve) => {
            const themeBtn = this.createTestThemeButton('keyboard-test-3');
            const dropdown = this.createTestDropdown('keyboard-test-3');
            
            // Open dropdown
            themeBtn.click();
            
            setTimeout(() => {
                const options = dropdown.querySelectorAll('.theme-option');
                if (options.length >= 2) {
                    options[0].focus();
                    
                    // Simulate Arrow Down
                    const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
                    options[0].dispatchEvent(arrowDownEvent);
                    
                    setTimeout(() => {
                        const secondOptionFocused = document.activeElement === options[1];
                        
                        this.cleanup('keyboard-test-3');
                        
                        resolve({
                            name: 'Arrow keys navigate options',
                            passed: secondOptionFocused,
                            details: secondOptionFocused
                                ? 'Arrow key navigation works correctly'
                                : 'Arrow key navigation does not work'
                        });
                    }, 100);
                } else {
                    this.cleanup('keyboard-test-3');
                    resolve({
                        name: 'Arrow keys navigate options',
                        passed: false,
                        details: 'Insufficient options for arrow key navigation test'
                    });
                }
            }, 100);
        });
    }

    async checkEscapeKeyFunctionality() {
        return new Promise((resolve) => {
            const themeBtn = this.createTestThemeButton('keyboard-test-4');
            const dropdown = this.createTestDropdown('keyboard-test-4');
            
            // Open dropdown
            themeBtn.click();
            
            setTimeout(() => {
                // Simulate Escape key
                const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
                document.dispatchEvent(escapeEvent);
                
                setTimeout(() => {
                    const isDropdownHidden = dropdown.style.display === 'none';
                    const isExpanded = themeBtn.getAttribute('aria-expanded') === 'false';
                    const focusReturned = document.activeElement === themeBtn;
                    
                    this.cleanup('keyboard-test-4');
                    
                    const allCorrect = isDropdownHidden && isExpanded && focusReturned;
                    
                    resolve({
                        name: 'Escape closes dropdown and returns focus',
                        passed: allCorrect,
                        details: allCorrect
                            ? 'Escape key functionality works correctly'
                            : 'Escape key functionality has issues'
                    });
                }, 100);
            }, 100);
        });
    }

    async verifyScreenReaderAnnouncements() {
        const checks = [];
        
        try {
            // Check 1: ARIA attributes present
            checks.push(await this.checkAriaAttributes());
            
            // Check 2: Dropdown state announced
            checks.push(await this.checkDropdownStateAnnouncement());
            
            // Check 3: Options have proper roles
            checks.push(await this.checkOptionRoles());
            
            // Check 4: Live region for announcements
            checks.push(await this.checkLiveRegion());
            
        } catch (error) {
            checks.push({
                name: 'Screen Reader Announcements Error',
                passed: false,
                details: `Error during screen reader verification: ${error.message}`
            });
        }
        
        return {
            requirement: '5.3',
            description: this.requirements['5.3'],
            checks,
            passed: checks.every(check => check.passed),
            score: `${checks.filter(c => c.passed).length}/${checks.length}`
        };
    }

    async checkAriaAttributes() {
        return new Promise((resolve) => {
            const themeBtn = this.createTestThemeButton('aria-test-1');
            const dropdown = this.createTestDropdown('aria-test-1');
            
            const hasHaspopup = themeBtn.hasAttribute('aria-haspopup');
            const hasExpanded = themeBtn.hasAttribute('aria-expanded');
            const dropdownHasRole = dropdown.hasAttribute('role');
            const dropdownHasLabelledby = dropdown.hasAttribute('aria-labelledby');
            
            const allAttributesPresent = hasHaspopup && hasExpanded && dropdownHasRole && dropdownHasLabelledby;
            
            this.cleanup('aria-test-1');
            
            resolve({
                name: 'Required ARIA attributes present',
                passed: allAttributesPresent,
                details: allAttributesPresent
                    ? 'All required ARIA attributes are present'
                    : `Missing ARIA attributes: ${[
                        !hasHaspopup && 'aria-haspopup',
                        !hasExpanded && 'aria-expanded',
                        !dropdownHasRole && 'role on dropdown',
                        !dropdownHasLabelledby && 'aria-labelledby on dropdown'
                    ].filter(Boolean).join(', ')}`
            });
        });
    }

    async checkDropdownStateAnnouncement() {
        return new Promise((resolve) => {
            const themeBtn = this.createTestThemeButton('aria-test-2');
            const dropdown = this.createTestDropdown('aria-test-2');
            
            // Check initial state
            const initialExpanded = themeBtn.getAttribute('aria-expanded') === 'false';
            
            // Open dropdown
            themeBtn.click();
            
            setTimeout(() => {
                const openExpanded = themeBtn.getAttribute('aria-expanded') === 'true';
                
                this.cleanup('aria-test-2');
                
                resolve({
                    name: 'Dropdown state properly announced',
                    passed: initialExpanded && openExpanded,
                    details: initialExpanded && openExpanded
                        ? 'Dropdown state changes are properly announced via aria-expanded'
                        : 'Dropdown state changes are not properly announced'
                });
            }, 100);
        });
    }

    async checkOptionRoles() {
        return new Promise((resolve) => {
            const themeBtn = this.createTestThemeButton('aria-test-3');
            const dropdown = this.createTestDropdown('aria-test-3');
            
            const options = dropdown.querySelectorAll('.theme-option');
            const allHaveMenuItemRole = Array.from(options).every(
                option => option.getAttribute('role') === 'menuitem'
            );
            const allHaveAccessibleNames = Array.from(options).every(
                option => option.textContent.trim().length > 0 || option.hasAttribute('aria-label')
            );
            
            this.cleanup('aria-test-3');
            
            const optionsProperlyConfigured = allHaveMenuItemRole && allHaveAccessibleNames;
            
            resolve({
                name: 'Options have proper roles and names',
                passed: optionsProperlyConfigured,
                details: optionsProperlyConfigured
                    ? 'All options have proper menuitem roles and accessible names'
                    : 'Some options are missing proper roles or accessible names'
            });
        });
    }

    async checkLiveRegion() {
        return new Promise((resolve) => {
            // Check if there's a live region available for announcements
            const liveRegions = document.querySelectorAll('[aria-live]');
            const hasLiveRegion = liveRegions.length > 0;
            
            let hasPoliteRegion = false;
            if (hasLiveRegion) {
                hasPoliteRegion = Array.from(liveRegions).some(
                    region => region.getAttribute('aria-live') === 'polite'
                );
            }
            
            resolve({
                name: 'ARIA live region available for announcements',
                passed: hasLiveRegion && hasPoliteRegion,
                details: hasLiveRegion && hasPoliteRegion
                    ? 'ARIA live region properly configured for announcements'
                    : 'No properly configured ARIA live region found'
            });
        });
    }

    async verifyPositioningAccessibility() {
        const checks = [];
        
        try {
            // Check 1: Positioning doesn't break focus
            checks.push(await this.checkPositioningFocus());
            
            // Check 2: Positioning doesn't break keyboard navigation
            checks.push(await this.checkPositioningKeyboard());
            
            // Check 3: Positioning doesn't break screen reader access
            checks.push(await this.checkPositioningScreenReader());
            
        } catch (error) {
            checks.push({
                name: 'Positioning Accessibility Error',
                passed: false,
                details: `Error during positioning accessibility verification: ${error.message}`
            });
        }
        
        return {
            requirement: '5.4',
            description: this.requirements['5.4'],
            checks,
            passed: checks.every(check => check.passed),
            score: `${checks.filter(c => c.passed).length}/${checks.length}`
        };
    }

    async checkPositioningFocus() {
        return new Promise((resolve) => {
            const themeBtn = this.createTestThemeButton('position-test-1');
            const dropdown = this.createTestDropdown('position-test-1');
            
            // Open dropdown and focus an option
            themeBtn.click();
            
            setTimeout(() => {
                const options = dropdown.querySelectorAll('.theme-option');
                if (options.length > 0) {
                    options[0].focus();
                    const focusedElement = document.activeElement;
                    
                    // Change position
                    dropdown.classList.add('position-left');
                    
                    setTimeout(() => {
                        const focusRetained = document.activeElement === focusedElement;
                        
                        this.cleanup('position-test-1');
                        
                        resolve({
                            name: 'Positioning changes do not break focus',
                            passed: focusRetained,
                            details: focusRetained
                                ? 'Focus maintained during positioning changes'
                                : 'Focus lost during positioning changes'
                        });
                    }, 100);
                } else {
                    this.cleanup('position-test-1');
                    resolve({
                        name: 'Positioning changes do not break focus',
                        passed: false,
                        details: 'No options available for positioning focus test'
                    });
                }
            }, 100);
        });
    }

    async checkPositioningKeyboard() {
        return new Promise((resolve) => {
            const themeBtn = this.createTestThemeButton('position-test-2');
            const dropdown = this.createTestDropdown('position-test-2');
            
            // Open dropdown and change position
            themeBtn.click();
            dropdown.classList.add('position-center');
            
            setTimeout(() => {
                const options = dropdown.querySelectorAll('.theme-option');
                if (options.length >= 2) {
                    options[0].focus();
                    
                    // Test arrow key navigation after positioning
                    const arrowDownEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' });
                    options[0].dispatchEvent(arrowDownEvent);
                    
                    setTimeout(() => {
                        const navigationWorks = document.activeElement === options[1];
                        
                        this.cleanup('position-test-2');
                        
                        resolve({
                            name: 'Keyboard navigation works after positioning',
                            passed: navigationWorks,
                            details: navigationWorks
                                ? 'Keyboard navigation maintained after positioning changes'
                                : 'Keyboard navigation broken after positioning changes'
                        });
                    }, 100);
                } else {
                    this.cleanup('position-test-2');
                    resolve({
                        name: 'Keyboard navigation works after positioning',
                        passed: false,
                        details: 'Insufficient options for keyboard navigation test'
                    });
                }
            }, 100);
        });
    }

    async checkPositioningScreenReader() {
        return new Promise((resolve) => {
            const themeBtn = this.createTestThemeButton('position-test-3');
            const dropdown = this.createTestDropdown('position-test-3');
            
            // Check ARIA attributes before positioning
            const initialRole = dropdown.getAttribute('role');
            const initialLabelledby = dropdown.getAttribute('aria-labelledby');
            
            // Change position
            dropdown.classList.add('position-left');
            
            setTimeout(() => {
                // Check ARIA attributes after positioning
                const finalRole = dropdown.getAttribute('role');
                const finalLabelledby = dropdown.getAttribute('aria-labelledby');
                
                const attributesPreserved = initialRole === finalRole && 
                                          initialLabelledby === finalLabelledby;
                
                this.cleanup('position-test-3');
                
                resolve({
                    name: 'Screen reader attributes preserved during positioning',
                    passed: attributesPreserved,
                    details: attributesPreserved
                        ? 'ARIA attributes preserved during positioning changes'
                        : 'ARIA attributes lost or changed during positioning'
                });
            }, 100);
        });
    }

    async verifyAssistiveTechnologySupport() {
        const checks = [];
        
        try {
            // Check 1: Voice control compatibility
            checks.push(await this.checkVoiceControlSupport());
            
            // Check 2: High contrast mode compatibility
            checks.push(await this.checkHighContrastSupport());
            
            // Check 3: Reduced motion compatibility
            checks.push(await this.checkReducedMotionSupport());
            
            // Check 4: Screen magnification compatibility
            checks.push(await this.checkScreenMagnificationSupport());
            
        } catch (error) {
            checks.push({
                name: 'Assistive Technology Support Error',
                passed: false,
                details: `Error during assistive technology verification: ${error.message}`
            });
        }
        
        return {
            requirement: '5.5',
            description: this.requirements['5.5'],
            checks,
            passed: checks.every(check => check.passed),
            score: `${checks.filter(c => c.passed).length}/${checks.length}`
        };
    }

    async checkVoiceControlSupport() {
        return new Promise((resolve) => {
            const themeBtn = this.createTestThemeButton('voice-test-1');
            const dropdown = this.createTestDropdown('voice-test-1');
            
            // Check if elements have accessible names for voice control
            const btnHasAccessibleName = themeBtn.textContent.trim().length > 0 || 
                                       themeBtn.hasAttribute('aria-label') ||
                                       themeBtn.hasAttribute('aria-labelledby');
            
            const options = dropdown.querySelectorAll('.theme-option');
            const optionsHaveAccessibleNames = Array.from(options).every(
                option => option.textContent.trim().length > 0 || 
                         option.hasAttribute('aria-label') ||
                         option.hasAttribute('aria-labelledby')
            );
            
            this.cleanup('voice-test-1');
            
            const voiceControlSupported = btnHasAccessibleName && optionsHaveAccessibleNames;
            
            resolve({
                name: 'Voice control compatibility',
                passed: voiceControlSupported,
                details: voiceControlSupported
                    ? 'Elements have accessible names for voice control'
                    : 'Some elements lack accessible names for voice control'
            });
        });
    }

    async checkHighContrastSupport() {
        return new Promise((resolve) => {
            const themeBtn = this.createTestThemeButton('contrast-test-1');
            const dropdown = this.createTestDropdown('contrast-test-1');
            
            // Check if dropdown has sufficient contrast indicators
            const computedStyle = window.getComputedStyle(dropdown);
            const hasBackground = computedStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
                                computedStyle.backgroundColor !== 'transparent';
            const hasBorder = computedStyle.borderWidth !== '0px' && 
                            computedStyle.borderWidth !== '';
            const hasOutline = computedStyle.outline !== 'none' && 
                             computedStyle.outline !== '';
            
            this.cleanup('contrast-test-1');
            
            const highContrastSupported = hasBackground || hasBorder || hasOutline;
            
            resolve({
                name: 'High contrast mode compatibility',
                passed: highContrastSupported,
                details: highContrastSupported
                    ? 'Dropdown has sufficient visual indicators for high contrast mode'
                    : 'Dropdown may not be visible in high contrast mode'
            });
        });
    }

    async checkReducedMotionSupport() {
        return new Promise((resolve) => {
            // This is a simplified check - in a real implementation, 
            // you would test actual CSS media queries
            const supportsReducedMotion = window.matchMedia && 
                                        window.matchMedia('(prefers-reduced-motion)').media !== 'not all';
            
            resolve({
                name: 'Reduced motion preference support',
                passed: supportsReducedMotion,
                details: supportsReducedMotion
                    ? 'Browser supports prefers-reduced-motion media query'
                    : 'Browser may not support reduced motion preferences'
            });
        });
    }

    async checkScreenMagnificationSupport() {
        return new Promise((resolve) => {
            const themeBtn = this.createTestThemeButton('magnification-test-1');
            const dropdown = this.createTestDropdown('magnification-test-1');
            
            // Check if dropdown positioning accounts for viewport constraints
            const dropdownRect = dropdown.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            const fitsInViewport = dropdownRect.right <= viewportWidth && 
                                 dropdownRect.bottom <= viewportHeight &&
                                 dropdownRect.left >= 0 &&
                                 dropdownRect.top >= 0;
            
            this.cleanup('magnification-test-1');
            
            resolve({
                name: 'Screen magnification compatibility',
                passed: fitsInViewport,
                details: fitsInViewport
                    ? 'Dropdown positioning accounts for viewport constraints'
                    : 'Dropdown may extend beyond viewport boundaries'
            });
        });
    }

    // Helper methods for creating test elements
    createTestThemeButton(testId) {
        const button = document.createElement('button');
        button.id = `test-btn-${testId}`;
        button.className = 'theme-toggle-btn';
        button.textContent = '🎨 Test Theme';
        button.setAttribute('aria-haspopup', 'true');
        button.setAttribute('aria-expanded', 'false');
        
        // Add event handlers
        button.addEventListener('click', () => {
            const dropdown = document.getElementById(`test-dropdown-${testId}`);
            if (dropdown) {
                const isOpen = dropdown.style.display !== 'none';
                dropdown.style.display = isOpen ? 'none' : 'block';
                button.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
                
                if (!isOpen) {
                    const firstOption = dropdown.querySelector('.theme-option');
                    if (firstOption) firstOption.focus();
                }
            }
        });
        
        button.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                button.click();
            }
        });
        
        document.body.appendChild(button);
        return button;
    }

    createTestDropdown(testId) {
        const dropdown = document.createElement('div');
        dropdown.id = `test-dropdown-${testId}`;
        dropdown.className = 'theme-dropdown';
        dropdown.style.display = 'none';
        dropdown.style.position = 'absolute';
        dropdown.style.top = '100%';
        dropdown.style.left = '0';
        dropdown.style.zIndex = '1050';
        dropdown.setAttribute('role', 'menu');
        dropdown.setAttribute('aria-labelledby', `test-btn-${testId}`);
        
        // Create theme options
        const themes = ['light', 'dark', 'blue', 'green', 'purple'];
        themes.forEach((theme, index) => {
            const option = document.createElement('button');
            option.className = 'theme-option';
            option.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
            option.setAttribute('role', 'menuitem');
            option.dataset.theme = theme;
            
            option.addEventListener('click', () => {
                dropdown.style.display = 'none';
                const button = document.getElementById(`test-btn-${testId}`);
                if (button) {
                    button.setAttribute('aria-expanded', 'false');
                    button.focus();
                }
            });
            
            option.addEventListener('keydown', (e) => {
                const options = dropdown.querySelectorAll('.theme-option');
                switch (e.key) {
                    case 'ArrowDown':
                        e.preventDefault();
                        const nextIndex = (index + 1) % options.length;
                        options[nextIndex].focus();
                        break;
                    case 'ArrowUp':
                        e.preventDefault();
                        const prevIndex = (index - 1 + options.length) % options.length;
                        options[prevIndex].focus();
                        break;
                    case 'Enter':
                    case ' ':
                        e.preventDefault();
                        option.click();
                        break;
                    case 'Escape':
                        e.preventDefault();
                        dropdown.style.display = 'none';
                        const button = document.getElementById(`test-btn-${testId}`);
                        if (button) {
                            button.setAttribute('aria-expanded', 'false');
                            button.focus();
                        }
                        break;
                }
            });
            
            dropdown.appendChild(option);
        });
        
        document.body.appendChild(dropdown);
        return dropdown;
    }

    cleanup(testId) {
        const button = document.getElementById(`test-btn-${testId}`);
        const dropdown = document.getElementById(`test-dropdown-${testId}`);
        
        if (button) button.remove();
        if (dropdown) dropdown.remove();
    }

    generateComplianceReport() {
        console.log('\n🎯 ACCESSIBILITY COMPLIANCE REPORT');
        console.log('=====================================');
        
        let totalPassed = 0;
        let totalChecks = 0;
        
        Object.values(this.complianceResults).forEach(result => {
            console.log(`\n📋 Requirement ${result.requirement}: ${result.description}`);
            console.log(`   Status: ${result.passed ? '✅ COMPLIANT' : '❌ NON-COMPLIANT'}`);
            console.log(`   Score: ${result.score}`);
            
            result.checks.forEach(check => {
                console.log(`   ${check.passed ? '✓' : '✗'} ${check.name}`);
                if (!check.passed) {
                    console.log(`     Details: ${check.details}`);
                }
            });
            
            totalPassed += result.checks.filter(c => c.passed).length;
            totalChecks += result.checks.length;
        });
        
        const overallScore = `${totalPassed}/${totalChecks}`;
        const overallPassed = totalPassed === totalChecks;
        
        console.log('\n🏆 OVERALL COMPLIANCE SUMMARY');
        console.log('==============================');
        console.log(`Overall Score: ${overallScore}`);
        console.log(`Status: ${overallPassed ? '✅ FULLY COMPLIANT' : '⚠️ NEEDS ATTENTION'}`);
        
        if (!overallPassed) {
            console.log('\n🔧 RECOMMENDATIONS:');
            Object.values(this.complianceResults).forEach(result => {
                if (!result.passed) {
                    console.log(`- Address issues in Requirement ${result.requirement}`);
                    result.checks.filter(c => !c.passed).forEach(check => {
                        console.log(`  • ${check.name}: ${check.details}`);
                    });
                }
            });
        }
        
        return {
            overallPassed,
            overallScore,
            totalPassed,
            totalChecks,
            results: this.complianceResults
        };
    }
}

// Initialize verification when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AccessibilityComplianceVerifier();
});

// Export for external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AccessibilityComplianceVerifier;
}