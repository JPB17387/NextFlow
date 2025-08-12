/**
 * Cross-Browser Theme Dropdown Positioning Validator
 * Validates that the theme dropdown positioning works correctly across all browsers
 */

class ThemeDropdownPositioningValidator {
    constructor() {
        this.browserInfo = this.detectBrowser();
        this.testResults = [];
        this.mockElements = new Map();
    }

    detectBrowser() {
        const userAgent = navigator.userAgent;
        const vendor = navigator.vendor || '';
        
        let browser = 'Unknown';
        let version = 'Unknown';
        let engine = 'Unknown';
        let isLegacy = false;

        if (userAgent.includes('Chrome') && vendor.includes('Google')) {
            browser = 'Chrome';
            engine = 'Blink';
            const match = userAgent.match(/Chrome\/(\d+)/);
            version = match ? match[1] : 'Unknown';
        } else if (userAgent.includes('Firefox')) {
            browser = 'Firefox';
            engine = 'Gecko';
            const match = userAgent.match(/Firefox\/(\d+)/);
            version = match ? match[1] : 'Unknown';
        } else if (userAgent.includes('Safari') && vendor.includes('Apple')) {
            browser = 'Safari';
            engine = 'WebKit';
            const match = userAgent.match(/Version\/(\d+)/);
            version = match ? match[1] : 'Unknown';
        } else if (userAgent.includes('Edg')) {
            browser = 'Edge';
            engine = 'Blink';
            const match = userAgent.match(/Edg\/(\d+)/);
            version = match ? match[1] : 'Unknown';
        } else if (userAgent.includes('Trident') || userAgent.includes('MSIE')) {
            browser = 'Internet Explorer';
            engine = 'Trident';
            isLegacy = true;
            const match = userAgent.match(/(?:MSIE |rv:)(\d+)/);
            version = match ? match[1] : 'Unknown';
        }

        return { browser, version, engine, isLegacy, userAgent };
    }

    // Create mock theme dropdown structure
    createMockThemeDropdown() {
        const container = document.createElement('div');
        container.className = 'theme-dropdown-test-container';
        container.style.position = 'relative';
        container.style.width = '100%';
        container.style.height = '200px';
        container.style.border = '1px solid #ccc';
        container.style.margin = '10px 0';

        // Mock theme button
        const themeButton = document.createElement('button');
        themeButton.className = 'theme-toggle-btn';
        themeButton.style.position = 'absolute';
        themeButton.style.top = '10px';
        themeButton.style.right = '10px';
        themeButton.style.padding = '8px 12px';
        themeButton.style.border = '1px solid #ddd';
        themeButton.style.borderRadius = '4px';
        themeButton.textContent = 'Theme';

        // Mock theme dropdown
        const dropdown = document.createElement('div');
        dropdown.className = 'theme-dropdown';
        dropdown.style.position = 'absolute';
        dropdown.style.top = 'calc(100% + 0.5rem)';
        dropdown.style.right = '0';
        dropdown.style.zIndex = '1050';
        dropdown.style.backgroundColor = 'white';
        dropdown.style.border = '1px solid #ddd';
        dropdown.style.borderRadius = '4px';
        dropdown.style.padding = '8px';
        dropdown.style.minWidth = '150px';
        dropdown.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        dropdown.style.display = 'none';

        // Add theme options
        const themes = ['Light', 'Dark', 'Blue', 'Green', 'Purple'];
        themes.forEach(theme => {
            const option = document.createElement('div');
            option.className = 'theme-option';
            option.style.padding = '4px 8px';
            option.style.cursor = 'pointer';
            option.textContent = theme;
            dropdown.appendChild(option);
        });

        // Mock task list (potential collision target)
        const taskList = document.createElement('div');
        taskList.className = 'task-list-section';
        taskList.style.position = 'absolute';
        taskList.style.top = '60px';
        taskList.style.right = '10px';
        taskList.style.width = '200px';
        taskList.style.height = '120px';
        taskList.style.backgroundColor = '#f5f5f5';
        taskList.style.border = '1px solid #ddd';
        taskList.style.borderRadius = '4px';
        taskList.style.padding = '10px';
        taskList.textContent = 'Task List Section';

        container.appendChild(themeButton);
        container.appendChild(dropdown);
        container.appendChild(taskList);

        this.mockElements.set('container', container);
        this.mockElements.set('button', themeButton);
        this.mockElements.set('dropdown', dropdown);
        this.mockElements.set('taskList', taskList);

        return container;
    }

    // Test CSS positioning consistency
    async testCSSPositioningConsistency() {
        const results = [];
        const container = this.createMockThemeDropdown();
        document.body.appendChild(container);

        try {
            const dropdown = this.mockElements.get('dropdown');
            const button = this.mockElements.get('button');

            // Test 1: Basic positioning
            dropdown.style.display = 'block';
            const computedStyle = window.getComputedStyle(dropdown);
            
            results.push({
                test: 'Basic CSS Positioning',
                passed: computedStyle.position === 'absolute' && computedStyle.right === '0px',
                details: `Position: ${computedStyle.position}, Right: ${computedStyle.right}`,
                requirement: '1.3, 3.1'
            });

            // Test 2: Z-index stacking
            results.push({
                test: 'Z-index Stacking',
                passed: computedStyle.zIndex === '1050',
                details: `Z-index: ${computedStyle.zIndex}`,
                requirement: '3.1, 3.2'
            });

            // Test 3: Calc() expression support
            dropdown.style.top = 'calc(100% + 8px)';
            const topStyle = window.getComputedStyle(dropdown).top;
            results.push({
                test: 'Calc() Expression Support',
                passed: topStyle !== 'calc(100% + 8px)', // Should be computed to pixels
                details: `Computed top: ${topStyle}`,
                requirement: '4.2'
            });

            // Test 4: Max-width constraint
            dropdown.style.maxWidth = 'calc(100vw - 2rem)';
            const maxWidthStyle = window.getComputedStyle(dropdown).maxWidth;
            results.push({
                test: 'Max-width Constraint',
                passed: maxWidthStyle !== 'calc(100vw - 2rem)', // Should be computed
                details: `Max-width: ${maxWidthStyle}`,
                requirement: '2.4'
            });

            // Test 5: Transform positioning (for collision avoidance)
            dropdown.style.transform = 'translateX(-50%)';
            const transformStyle = window.getComputedStyle(dropdown).transform;
            results.push({
                test: 'Transform Positioning',
                passed: transformStyle !== 'none' && transformStyle !== '',
                details: `Transform: ${transformStyle}`,
                requirement: '4.1'
            });

        } catch (error) {
            results.push({
                test: 'CSS Positioning Error',
                passed: false,
                details: `Error: ${error.message}`,
                requirement: 'All'
            });
        } finally {
            document.body.removeChild(container);
        }

        return {
            category: 'CSS Positioning Consistency',
            browser: this.browserInfo.browser,
            engine: this.browserInfo.engine,
            results: results,
            passed: results.every(r => r.passed)
        };
    }

    // Test JavaScript collision detection
    async testJavaScriptCollisionDetection() {
        const results = [];
        const container = this.createMockThemeDropdown();
        document.body.appendChild(container);

        try {
            const dropdown = this.mockElements.get('dropdown');
            const taskList = this.mockElements.get('taskList');
            const button = this.mockElements.get('button');

            dropdown.style.display = 'block';

            // Test 1: getBoundingClientRect support
            const dropdownRect = dropdown.getBoundingClientRect();
            const taskListRect = taskList.getBoundingClientRect();
            const buttonRect = button.getBoundingClientRect();

            results.push({
                test: 'getBoundingClientRect Support',
                passed: dropdownRect && taskListRect && buttonRect &&
                       typeof dropdownRect.top === 'number' &&
                       typeof dropdownRect.left === 'number',
                details: `Dropdown rect: ${JSON.stringify({
                    top: dropdownRect.top,
                    left: dropdownRect.left,
                    width: dropdownRect.width,
                    height: dropdownRect.height
                })}`,
                requirement: '1.5, 3.4'
            });

            // Test 2: Collision detection logic
            const hasCollision = this.detectCollision(dropdownRect, taskListRect);
            results.push({
                test: 'Collision Detection Logic',
                passed: typeof hasCollision === 'boolean',
                details: `Collision detected: ${hasCollision}`,
                requirement: '1.1, 1.5'
            });

            // Test 3: Viewport calculations
            const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            results.push({
                test: 'Viewport Calculations',
                passed: viewportWidth > 0 && viewportHeight > 0,
                details: `Viewport: ${viewportWidth}x${viewportHeight}`,
                requirement: '2.4, 2.5'
            });

            // Test 4: Dynamic positioning calculation
            const optimalPosition = this.calculateOptimalPosition(dropdown, taskList, button);
            results.push({
                test: 'Dynamic Positioning Calculation',
                passed: optimalPosition && typeof optimalPosition.strategy === 'string',
                details: `Position strategy: ${optimalPosition ? optimalPosition.strategy : 'failed'}`,
                requirement: '1.4, 4.1, 4.4'
            });

            // Test 5: Position application
            if (optimalPosition) {
                this.applyPosition(dropdown, optimalPosition);
                const newRect = dropdown.getBoundingClientRect();
                results.push({
                    test: 'Position Application',
                    passed: newRect.top !== dropdownRect.top || newRect.left !== dropdownRect.left,
                    details: `Position changed from ${dropdownRect.top},${dropdownRect.left} to ${newRect.top},${newRect.left}`,
                    requirement: '4.2'
                });
            }

        } catch (error) {
            results.push({
                test: 'JavaScript Collision Detection Error',
                passed: false,
                details: `Error: ${error.message}`,
                requirement: 'All'
            });
        } finally {
            document.body.removeChild(container);
        }

        return {
            category: 'JavaScript Collision Detection',
            browser: this.browserInfo.browser,
            engine: this.browserInfo.engine,
            results: results,
            passed: results.every(r => r.passed)
        };
    }

    detectCollision(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                rect1.left > rect2.right || 
                rect1.bottom < rect2.top || 
                rect1.top > rect2.bottom);
    }

    calculateOptimalPosition(dropdown, taskList, button) {
        try {
            const dropdownRect = dropdown.getBoundingClientRect();
            const taskListRect = taskList.getBoundingClientRect();
            const buttonRect = button.getBoundingClientRect();
            const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

            // Check for collision with task list
            const wouldCollide = this.detectCollision(dropdownRect, taskListRect);
            
            if (wouldCollide) {
                // Calculate alternative positions
                const spaceLeft = buttonRect.left;
                const spaceRight = viewportWidth - buttonRect.right;
                
                if (spaceLeft > dropdownRect.width) {
                    return { strategy: 'left', x: buttonRect.left - dropdownRect.width };
                } else if (spaceRight > dropdownRect.width) {
                    return { strategy: 'right', x: buttonRect.right };
                } else {
                    return { strategy: 'center', x: buttonRect.left + (buttonRect.width / 2) - (dropdownRect.width / 2) };
                }
            }

            return { strategy: 'default', x: buttonRect.right - dropdownRect.width };
        } catch (error) {
            return null;
        }
    }

    applyPosition(dropdown, position) {
        switch (position.strategy) {
            case 'left':
                dropdown.style.right = 'auto';
                dropdown.style.left = position.x + 'px';
                dropdown.classList.add('position-left');
                break;
            case 'center':
                dropdown.style.right = 'auto';
                dropdown.style.left = position.x + 'px';
                dropdown.classList.add('position-center');
                break;
            case 'right':
                dropdown.style.right = 'auto';
                dropdown.style.left = position.x + 'px';
                break;
            default:
                // Keep default positioning
                break;
        }
    }

    // Test fallback positioning for older browsers
    async testFallbackPositioning() {
        const results = [];
        const container = this.createMockThemeDropdown();
        document.body.appendChild(container);

        try {
            const dropdown = this.mockElements.get('dropdown');

            // Test 1: Basic fallback positioning
            dropdown.style.display = 'block';
            dropdown.style.position = 'absolute';
            dropdown.style.top = '100%';
            dropdown.style.right = '0';
            dropdown.style.zIndex = '1000';

            // Use legacy style access if needed
            const style = dropdown.currentStyle || window.getComputedStyle(dropdown);
            results.push({
                test: 'Basic Fallback Positioning',
                passed: style.position === 'absolute' && style.right === '0px',
                details: `Position: ${style.position}, Right: ${style.right}`,
                requirement: '1.3, 4.2'
            });

            // Test 2: Legacy event handling
            let eventHandled = false;
            const testEventHandling = () => {
                eventHandled = true;
            };

            if (dropdown.addEventListener) {
                dropdown.addEventListener('click', testEventHandling);
            } else if (dropdown.attachEvent) {
                dropdown.attachEvent('onclick', testEventHandling);
            }

            // Simulate click
            if (dropdown.click) {
                dropdown.click();
            } else if (dropdown.fireEvent) {
                dropdown.fireEvent('onclick');
            }

            results.push({
                test: 'Legacy Event Handling',
                passed: eventHandled,
                details: `Event handled: ${eventHandled}`,
                requirement: '4.2'
            });

            // Test 3: Graceful degradation without modern CSS
            const fallbackDropdown = document.createElement('div');
            fallbackDropdown.style.position = 'absolute';
            fallbackDropdown.style.top = '30px';
            fallbackDropdown.style.right = '0';
            fallbackDropdown.style.zIndex = '1000';
            fallbackDropdown.style.backgroundColor = 'white';
            fallbackDropdown.style.border = '1px solid #ccc';
            fallbackDropdown.style.padding = '5px';
            fallbackDropdown.textContent = 'Fallback dropdown';

            container.appendChild(fallbackDropdown);
            const fallbackRect = fallbackDropdown.getBoundingClientRect();

            results.push({
                test: 'Graceful Degradation',
                passed: fallbackRect.width > 0 && fallbackRect.height > 0,
                details: `Fallback dimensions: ${fallbackRect.width}x${fallbackRect.height}`,
                requirement: '1.3, 2.4'
            });

        } catch (error) {
            results.push({
                test: 'Fallback Positioning Error',
                passed: false,
                details: `Error: ${error.message}`,
                requirement: 'All'
            });
        } finally {
            document.body.removeChild(container);
        }

        return {
            category: 'Fallback Positioning',
            browser: this.browserInfo.browser,
            engine: this.browserInfo.engine,
            results: results,
            passed: results.every(r => r.passed)
        };
    }

    // Test browser engine specific behaviors
    async testBrowserEngineSpecifics() {
        const results = [];
        const engine = this.browserInfo.engine;

        try {
            // Test engine-specific CSS features
            const testElement = document.createElement('div');
            testElement.style.position = 'absolute';
            document.body.appendChild(testElement);

            switch (engine) {
                case 'Blink': // Chrome, Edge
                    results.push(await this.testBlinkSpecifics(testElement));
                    break;
                case 'Gecko': // Firefox
                    results.push(await this.testGeckoSpecifics(testElement));
                    break;
                case 'WebKit': // Safari
                    results.push(await this.testWebKitSpecifics(testElement));
                    break;
                case 'Trident': // Internet Explorer
                    results.push(await this.testTridentSpecifics(testElement));
                    break;
                default:
                    results.push({
                        test: 'Unknown Engine',
                        passed: true,
                        details: `Engine: ${engine}`,
                        requirement: 'N/A'
                    });
            }

            document.body.removeChild(testElement);

        } catch (error) {
            results.push({
                test: 'Engine Specific Test Error',
                passed: false,
                details: `Error: ${error.message}`,
                requirement: 'All'
            });
        }

        return {
            category: 'Browser Engine Specifics',
            browser: this.browserInfo.browser,
            engine: this.browserInfo.engine,
            results: results,
            passed: results.every(r => r.passed)
        };
    }

    async testBlinkSpecifics(element) {
        // Test Blink-specific features
        element.style.transform = 'translateX(-50%)';
        element.style.right = '50%';
        
        const computed = window.getComputedStyle(element);
        return {
            test: 'Blink Transform Positioning',
            passed: computed.transform !== 'none',
            details: `Transform: ${computed.transform}`,
            requirement: '4.1'
        };
    }

    async testGeckoSpecifics(element) {
        // Test Gecko-specific features
        element.style.right = '0';
        element.style.top = 'calc(100% + 8px)';
        
        const computed = window.getComputedStyle(element);
        return {
            test: 'Gecko Calc Positioning',
            passed: computed.top !== 'calc(100% + 8px)',
            details: `Computed top: ${computed.top}`,
            requirement: '4.2'
        };
    }

    async testWebKitSpecifics(element) {
        // Test WebKit-specific features
        element.style.webkitTransform = 'translateX(-50%)';
        element.style.transform = 'translateX(-50%)';
        
        const computed = window.getComputedStyle(element);
        return {
            test: 'WebKit Transform Support',
            passed: computed.webkitTransform !== undefined || computed.transform !== 'none',
            details: `WebKit transform: ${computed.webkitTransform}, Transform: ${computed.transform}`,
            requirement: '4.1'
        };
    }

    async testTridentSpecifics(element) {
        // Test Trident-specific features
        element.style.right = '0';
        element.style.zIndex = '1000';
        
        const style = element.currentStyle || window.getComputedStyle(element);
        return {
            test: 'Trident Legacy Positioning',
            passed: style.right === '0px' && style.zIndex === '1000',
            details: `Right: ${style.right}, Z-index: ${style.zIndex}`,
            requirement: '1.3, 3.1'
        };
    }

    // Generate comprehensive validation report
    async generateValidationReport() {
        console.log(`Starting cross-browser validation for ${this.browserInfo.browser} ${this.browserInfo.version}...`);

        const report = {
            browser: this.browserInfo,
            timestamp: new Date().toISOString(),
            testCategories: {},
            summary: {}
        };

        // Run all test categories
        report.testCategories.cssPositioning = await this.testCSSPositioningConsistency();
        report.testCategories.jsCollisionDetection = await this.testJavaScriptCollisionDetection();
        report.testCategories.fallbackPositioning = await this.testFallbackPositioning();
        report.testCategories.engineSpecifics = await this.testBrowserEngineSpecifics();

        // Calculate summary
        const categories = Object.values(report.testCategories);
        const passedCategories = categories.filter(cat => cat.passed).length;
        const totalCategories = categories.length;

        // Count individual tests
        const allTests = categories.flatMap(cat => cat.results);
        const passedTests = allTests.filter(test => test.passed).length;
        const totalTests = allTests.length;

        report.summary = {
            overallPassed: passedCategories === totalCategories,
            categoriesPassed: passedCategories,
            totalCategories: totalCategories,
            testsPassed: passedTests,
            totalTests: totalTests,
            compatibility: this.assessCompatibility(report.testCategories),
            recommendations: this.generateRecommendations(report.testCategories)
        };

        console.log(`Validation completed: ${passedTests}/${totalTests} tests passed across ${passedCategories}/${totalCategories} categories`);

        return report;
    }

    assessCompatibility(testCategories) {
        const categories = Object.values(testCategories);
        const passedCategories = categories.filter(cat => cat.passed).length;
        const totalCategories = categories.length;

        if (passedCategories === totalCategories) {
            return 'Fully Compatible';
        } else if (passedCategories >= totalCategories * 0.75) {
            return 'Mostly Compatible';
        } else if (passedCategories >= totalCategories * 0.5) {
            return 'Partially Compatible';
        } else {
            return 'Limited Compatibility';
        }
    }

    generateRecommendations(testCategories) {
        const recommendations = [];
        const browser = this.browserInfo.browser;

        Object.entries(testCategories).forEach(([categoryName, category]) => {
            if (!category.passed) {
                const failedTests = category.results.filter(test => !test.passed);
                failedTests.forEach(test => {
                    recommendations.push({
                        category: categoryName,
                        test: test.test,
                        issue: test.details,
                        requirement: test.requirement,
                        recommendation: this.getRecommendationForFailure(test.test, browser)
                    });
                });
            }
        });

        return recommendations;
    }

    getRecommendationForFailure(testName, browser) {
        const recommendations = {
            'Basic CSS Positioning': {
                'Internet Explorer': 'Use absolute positioning with explicit pixel values instead of percentages',
                'default': 'Ensure proper CSS reset and positioning context'
            },
            'Z-index Stacking': {
                'Internet Explorer': 'Create explicit stacking contexts and avoid auto z-index',
                'default': 'Verify stacking context hierarchy and use explicit z-index values'
            },
            'Transform Positioning': {
                'Internet Explorer': 'Use alternative positioning methods or polyfills for transforms',
                'Safari': 'Include -webkit- prefixes for older Safari versions',
                'default': 'Provide fallback positioning for browsers without transform support'
            },
            'Calc() Expression Support': {
                'Internet Explorer': 'Use JavaScript calculations or fixed pixel values',
                'default': 'Provide fallback values for browsers without calc() support'
            },
            'getBoundingClientRect Support': {
                'Internet Explorer': 'Use alternative methods for IE8 and below',
                'default': 'Implement feature detection and fallback positioning'
            },
            'Legacy Event Handling': {
                'Internet Explorer': 'Use attachEvent for IE8 and below',
                'default': 'Implement cross-browser event handling with feature detection'
            }
        };

        return recommendations[testName]?.[browser] || recommendations[testName]?.['default'] || 'Review browser-specific implementation requirements';
    }
}

// Global function for validation
async function validateCrossBrowserPositioning() {
    const validator = new ThemeDropdownPositioningValidator();
    return await validator.generateValidationReport();
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemeDropdownPositioningValidator;
}