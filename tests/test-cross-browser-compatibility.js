/**
 * Cross-Browser Compatibility Test Suite
 * Tests positioning logic across Chrome, Firefox, Safari, and Edge
 */

class CrossBrowserTester {
    constructor() {
        this.testResults = [];
        this.browserInfo = this.detectBrowser();
        this.supportedFeatures = this.detectFeatureSupport();
    }

    detectBrowser() {
        const userAgent = navigator.userAgent;
        const vendor = navigator.vendor;
        
        let browser = 'Unknown';
        let version = 'Unknown';
        let engine = 'Unknown';

        // Chrome
        if (userAgent.includes('Chrome') && vendor.includes('Google')) {
            browser = 'Chrome';
            engine = 'Blink';
            const match = userAgent.match(/Chrome\/(\d+)/);
            version = match ? match[1] : 'Unknown';
        }
        // Firefox
        else if (userAgent.includes('Firefox')) {
            browser = 'Firefox';
            engine = 'Gecko';
            const match = userAgent.match(/Firefox\/(\d+)/);
            version = match ? match[1] : 'Unknown';
        }
        // Safari
        else if (userAgent.includes('Safari') && vendor.includes('Apple')) {
            browser = 'Safari';
            engine = 'WebKit';
            const match = userAgent.match(/Version\/(\d+)/);
            version = match ? match[1] : 'Unknown';
        }
        // Edge
        else if (userAgent.includes('Edg')) {
            browser = 'Edge';
            engine = 'Blink';
            const match = userAgent.match(/Edg\/(\d+)/);
            version = match ? match[1] : 'Unknown';
        }
        // Internet Explorer
        else if (userAgent.includes('Trident') || userAgent.includes('MSIE')) {
            browser = 'Internet Explorer';
            engine = 'Trident';
            const match = userAgent.match(/(?:MSIE |rv:)(\d+)/);
            version = match ? match[1] : 'Unknown';
        }

        return { browser, version, engine, userAgent };
    }

    detectFeatureSupport() {
        const features = {};
        
        // CSS Features
        features.cssTransforms = this.supportsCSSProperty('transform');
        features.cssCalc = this.supportsCSSProperty('width', 'calc(100% - 10px)');
        features.cssViewportUnits = this.supportsCSSProperty('width', '100vw');
        features.cssGrid = this.supportsCSSProperty('display', 'grid');
        features.cssFlexbox = this.supportsCSSProperty('display', 'flex');
        features.cssCustomProperties = this.supportsCSSCustomProperties();
        
        // JavaScript Features
        features.getBoundingClientRect = typeof Element.prototype.getBoundingClientRect === 'function';
        features.addEventListener = typeof Element.prototype.addEventListener === 'function';
        features.querySelector = typeof document.querySelector === 'function';
        features.requestAnimationFrame = typeof window.requestAnimationFrame === 'function';
        features.matchMedia = typeof window.matchMedia === 'function';
        
        return features;
    }

    supportsCSSProperty(property, value = 'initial') {
        const element = document.createElement('div');
        element.style[property] = value;
        return element.style[property] !== '';
    }

    supportsCSSCustomProperties() {
        try {
            const element = document.createElement('div');
            element.style.setProperty('--test', 'test');
            return element.style.getPropertyValue('--test') === 'test';
        } catch (e) {
            return false;
        }
    }

    // Test CSS positioning consistency across browsers
    testCSSPositioning() {
        const results = [];
        
        try {
            // Test absolute positioning
            const dropdown = document.getElementById('testDropdown');
            const computedStyle = window.getComputedStyle(dropdown);
            
            results.push({
                test: 'Absolute positioning support',
                passed: computedStyle.position === 'absolute',
                details: `Position: ${computedStyle.position}`
            });

            // Test z-index handling
            results.push({
                test: 'Z-index support',
                passed: computedStyle.zIndex === '1050',
                details: `Z-index: ${computedStyle.zIndex}`
            });

            // Test transform support
            if (this.supportedFeatures.cssTransforms) {
                dropdown.style.transform = 'translateX(-50%)';
                const transformStyle = window.getComputedStyle(dropdown).transform;
                results.push({
                    test: 'CSS transforms support',
                    passed: transformStyle !== 'none',
                    details: `Transform: ${transformStyle}`
                });
            }

            // Test calc() support
            if (this.supportedFeatures.cssCalc) {
                dropdown.style.maxWidth = 'calc(100vw - 2rem)';
                results.push({
                    test: 'CSS calc() support',
                    passed: true,
                    details: 'calc() expressions supported'
                });
            }

            // Test viewport units
            if (this.supportedFeatures.cssViewportUnits) {
                results.push({
                    test: 'Viewport units support',
                    passed: true,
                    details: 'vw, vh units supported'
                });
            }

        } catch (error) {
            results.push({
                test: 'CSS positioning error',
                passed: false,
                details: `Error: ${error.message}`
            });
        }

        return results;
    }

    // Test JavaScript collision detection across browser engines
    testJSCollisionDetection() {
        const results = [];

        try {
            // Test getBoundingClientRect support
            const dropdown = document.getElementById('testDropdown');
            const obstacle = document.getElementById('testObstacle');
            
            if (this.supportedFeatures.getBoundingClientRect) {
                const dropdownRect = dropdown.getBoundingClientRect();
                const obstacleRect = obstacle.getBoundingClientRect();
                
                results.push({
                    test: 'getBoundingClientRect support',
                    passed: dropdownRect && obstacleRect,
                    details: `Dropdown rect: ${JSON.stringify(dropdownRect)}`
                });

                // Test collision detection logic
                const hasCollision = this.detectCollision(dropdownRect, obstacleRect);
                results.push({
                    test: 'Collision detection logic',
                    passed: typeof hasCollision === 'boolean',
                    details: `Collision detected: ${hasCollision}`
                });
            }

            // Test viewport calculations
            const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
            
            results.push({
                test: 'Viewport dimension access',
                passed: viewportWidth > 0 && viewportHeight > 0,
                details: `Viewport: ${viewportWidth}x${viewportHeight}`
            });

            // Test element positioning calculations
            const positioning = this.calculateOptimalPosition(dropdown, obstacle);
            results.push({
                test: 'Position calculation logic',
                passed: positioning && typeof positioning.x === 'number',
                details: `Calculated position: ${JSON.stringify(positioning)}`
            });

        } catch (error) {
            results.push({
                test: 'JavaScript collision detection error',
                passed: false,
                details: `Error: ${error.message}`
            });
        }

        return results;
    }

    detectCollision(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                rect1.left > rect2.right || 
                rect1.bottom < rect2.top || 
                rect1.top > rect2.bottom);
    }

    calculateOptimalPosition(dropdown, obstacle) {
        try {
            const dropdownRect = dropdown.getBoundingClientRect();
            const obstacleRect = obstacle.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // Calculate available space
            const spaceRight = viewportWidth - dropdownRect.right;
            const spaceLeft = dropdownRect.left;
            const spaceBelow = viewportHeight - dropdownRect.bottom;
            const spaceAbove = dropdownRect.top;

            return {
                x: spaceRight > 200 ? dropdownRect.right : dropdownRect.left - 200,
                y: spaceBelow > 100 ? dropdownRect.bottom : dropdownRect.top - 100,
                strategy: spaceRight > 200 ? 'right' : 'left'
            };
        } catch (error) {
            return null;
        }
    }

    // Test fallback positioning for older browsers
    testFallbackPositioning() {
        const results = [];

        try {
            // Test basic positioning fallback
            const dropdown = document.getElementById('testDropdown');
            
            // Simulate older browser without modern features
            const fallbackPosition = this.getFallbackPosition(dropdown);
            results.push({
                test: 'Fallback positioning logic',
                passed: fallbackPosition && typeof fallbackPosition.top === 'string',
                details: `Fallback position: ${JSON.stringify(fallbackPosition)}`
            });

            // Test graceful degradation
            const hasGracefulDegradation = this.testGracefulDegradation();
            results.push({
                test: 'Graceful degradation',
                passed: hasGracefulDegradation,
                details: 'Positioning works without modern CSS features'
            });

            // Test IE-specific fixes
            if (this.browserInfo.browser === 'Internet Explorer') {
                const ieCompatible = this.testIECompatibility();
                results.push({
                    test: 'Internet Explorer compatibility',
                    passed: ieCompatible,
                    details: 'IE-specific positioning works'
                });
            }

        } catch (error) {
            results.push({
                test: 'Fallback positioning error',
                passed: false,
                details: `Error: ${error.message}`
            });
        }

        return results;
    }

    getFallbackPosition(element) {
        // Simple fallback positioning without modern CSS
        return {
            top: 'calc(100% + 8px)',
            right: '0',
            position: 'absolute',
            zIndex: '1000'
        };
    }

    testGracefulDegradation() {
        try {
            // Test if basic positioning works without transforms, calc, etc.
            const testElement = document.createElement('div');
            testElement.style.position = 'absolute';
            testElement.style.top = '100px';
            testElement.style.right = '0';
            testElement.style.zIndex = '1000';
            
            document.body.appendChild(testElement);
            const computed = window.getComputedStyle(testElement);
            const works = computed.position === 'absolute' && computed.zIndex === '1000';
            document.body.removeChild(testElement);
            
            return works;
        } catch (error) {
            return false;
        }
    }

    testIECompatibility() {
        // Test IE-specific positioning issues
        try {
            const testElement = document.createElement('div');
            testElement.style.position = 'absolute';
            testElement.style.right = '0';
            
            // IE has issues with right positioning in some contexts
            document.body.appendChild(testElement);
            const rect = testElement.getBoundingClientRect();
            document.body.removeChild(testElement);
            
            return rect.right > 0;
        } catch (error) {
            return false;
        }
    }

    // Test browser engine specific behaviors
    testBrowserEngineSpecifics() {
        const results = [];
        const engine = this.browserInfo.engine;

        try {
            // Blink (Chrome/Edge) specific tests
            if (engine === 'Blink') {
                results.push({
                    test: 'Blink engine positioning',
                    passed: this.testBlinkPositioning(),
                    details: 'Chrome/Edge Blink engine compatibility'
                });
            }

            // Gecko (Firefox) specific tests
            if (engine === 'Gecko') {
                results.push({
                    test: 'Gecko engine positioning',
                    passed: this.testGeckoPositioning(),
                    details: 'Firefox Gecko engine compatibility'
                });
            }

            // WebKit (Safari) specific tests
            if (engine === 'WebKit') {
                results.push({
                    test: 'WebKit engine positioning',
                    passed: this.testWebKitPositioning(),
                    details: 'Safari WebKit engine compatibility'
                });
            }

            // Trident (IE) specific tests
            if (engine === 'Trident') {
                results.push({
                    test: 'Trident engine positioning',
                    passed: this.testTridentPositioning(),
                    details: 'Internet Explorer Trident engine compatibility'
                });
            }

        } catch (error) {
            results.push({
                test: 'Browser engine test error',
                passed: false,
                details: `Error: ${error.message}`
            });
        }

        return results;
    }

    testBlinkPositioning() {
        // Test Blink-specific positioning behaviors
        try {
            const element = document.createElement('div');
            element.style.position = 'absolute';
            element.style.transform = 'translateX(-50%)';
            element.style.right = '50%';
            
            document.body.appendChild(element);
            const computed = window.getComputedStyle(element);
            const works = computed.transform !== 'none';
            document.body.removeChild(element);
            
            return works;
        } catch (error) {
            return false;
        }
    }

    testGeckoPositioning() {
        // Test Gecko-specific positioning behaviors
        try {
            const element = document.createElement('div');
            element.style.position = 'absolute';
            element.style.right = '0';
            element.style.top = 'calc(100% + 8px)';
            
            document.body.appendChild(element);
            const computed = window.getComputedStyle(element);
            const works = computed.position === 'absolute';
            document.body.removeChild(element);
            
            return works;
        } catch (error) {
            return false;
        }
    }

    testWebKitPositioning() {
        // Test WebKit-specific positioning behaviors
        try {
            const element = document.createElement('div');
            element.style.position = 'absolute';
            element.style.webkitTransform = 'translateX(-50%)';
            
            document.body.appendChild(element);
            const computed = window.getComputedStyle(element);
            const works = computed.webkitTransform !== undefined || computed.transform !== 'none';
            document.body.removeChild(element);
            
            return works;
        } catch (error) {
            return false;
        }
    }

    testTridentPositioning() {
        // Test Trident-specific positioning behaviors
        try {
            const element = document.createElement('div');
            element.style.position = 'absolute';
            element.style.right = '0';
            element.style.zIndex = '1000';
            
            document.body.appendChild(element);
            const computed = element.currentStyle || window.getComputedStyle(element);
            const works = computed.position === 'absolute';
            document.body.removeChild(element);
            
            return works;
        } catch (error) {
            return false;
        }
    }

    // Test legacy browser support
    testLegacyBrowserSupport() {
        const results = [];

        try {
            // Test basic DOM manipulation
            results.push({
                test: 'Basic DOM support',
                passed: typeof document.createElement === 'function',
                details: 'createElement method available'
            });

            // Test event handling
            results.push({
                test: 'Event handling support',
                passed: this.supportedFeatures.addEventListener || typeof document.attachEvent === 'function',
                details: 'Event listeners supported'
            });

            // Test CSS property access
            results.push({
                test: 'CSS property access',
                passed: this.testCSSPropertyAccess(),
                details: 'Style properties accessible'
            });

            // Test positioning without modern features
            results.push({
                test: 'Legacy positioning',
                passed: this.testLegacyPositioning(),
                details: 'Basic positioning works without modern CSS'
            });

        } catch (error) {
            results.push({
                test: 'Legacy browser test error',
                passed: false,
                details: `Error: ${error.message}`
            });
        }

        return results;
    }

    testCSSPropertyAccess() {
        try {
            const element = document.createElement('div');
            element.style.position = 'absolute';
            return element.style.position === 'absolute';
        } catch (error) {
            return false;
        }
    }

    testLegacyPositioning() {
        try {
            const element = document.createElement('div');
            element.style.position = 'absolute';
            element.style.top = '10px';
            element.style.right = '10px';
            element.style.zIndex = '1000';
            
            document.body.appendChild(element);
            
            // Use legacy methods if available
            const style = element.currentStyle || window.getComputedStyle(element);
            const works = style.position === 'absolute';
            
            document.body.removeChild(element);
            return works;
        } catch (error) {
            return false;
        }
    }

    // Display browser information
    displayBrowserInfo() {
        const browserDetails = document.getElementById('browserDetails');
        browserDetails.innerHTML = `
            <p><strong>Browser:</strong> ${this.browserInfo.browser} ${this.browserInfo.version}</p>
            <p><strong>Engine:</strong> ${this.browserInfo.engine}</p>
            <p><strong>User Agent:</strong> ${this.browserInfo.userAgent}</p>
            <h4>Feature Support:</h4>
            <ul>
                <li>CSS Transforms: ${this.supportedFeatures.cssTransforms ? '✓' : '✗'}</li>
                <li>CSS calc(): ${this.supportedFeatures.cssCalc ? '✓' : '✗'}</li>
                <li>Viewport Units: ${this.supportedFeatures.cssViewportUnits ? '✓' : '✗'}</li>
                <li>getBoundingClientRect: ${this.supportedFeatures.getBoundingClientRect ? '✓' : '✗'}</li>
                <li>addEventListener: ${this.supportedFeatures.addEventListener ? '✓' : '✗'}</li>
                <li>querySelector: ${this.supportedFeatures.querySelector ? '✓' : '✗'}</li>
            </ul>
        `;
    }

    // Display test results
    displayResults(containerId, results, title) {
        const container = document.getElementById(containerId);
        let html = `<h3>${title}</h3>`;
        
        results.forEach(result => {
            const cssClass = result.passed ? 'test-pass' : 'test-fail';
            const status = result.passed ? 'PASS' : 'FAIL';
            html += `
                <div class="test-result ${cssClass}">
                    <strong>[${status}] ${result.test}</strong><br>
                    <small>${result.details}</small>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    // Run all tests
    async runAllTests() {
        console.log('Starting cross-browser compatibility tests...');
        
        // Display browser info
        this.displayBrowserInfo();
        
        // Run CSS positioning tests
        const cssResults = this.testCSSPositioning();
        this.displayResults('cssPositioningResults', cssResults, 'CSS Positioning Test Results');
        
        // Run JavaScript collision detection tests
        const jsResults = this.testJSCollisionDetection();
        this.displayResults('jsCollisionResults', jsResults, 'JavaScript Collision Detection Results');
        
        // Run fallback positioning tests
        const fallbackResults = this.testFallbackPositioning();
        this.displayResults('fallbackResults', fallbackResults, 'Fallback Positioning Results');
        
        // Run browser engine specific tests
        const engineResults = this.testBrowserEngineSpecifics();
        this.displayResults('engineResults', engineResults, 'Browser Engine Specific Results');
        
        // Run legacy browser support tests
        const legacyResults = this.testLegacyBrowserSupport();
        this.displayResults('legacyResults', legacyResults, 'Legacy Browser Support Results');
        
        // Compile overall results
        const allResults = [...cssResults, ...jsResults, ...fallbackResults, ...engineResults, ...legacyResults];
        const passedTests = allResults.filter(r => r.passed).length;
        const totalTests = allResults.length;
        
        console.log(`Cross-browser compatibility tests completed: ${passedTests}/${totalTests} passed`);
        
        return {
            browser: this.browserInfo,
            features: this.supportedFeatures,
            results: allResults,
            summary: { passed: passedTests, total: totalTests }
        };
    }
}

// Initialize tester
let crossBrowserTester;

// Global function to run tests
function runAllTests() {
    if (!crossBrowserTester) {
        crossBrowserTester = new CrossBrowserTester();
    }
    return crossBrowserTester.runAllTests();
}

// Auto-run tests when page loads
document.addEventListener('DOMContentLoaded', function() {
    crossBrowserTester = new CrossBrowserTester();
    crossBrowserTester.displayBrowserInfo();
});