/**
 * Cross-Browser Test Runner
 * Automated test runner for cross-browser compatibility testing
 */

class CrossBrowserTestRunner {
    constructor() {
        this.testResults = new Map();
        this.currentBrowser = this.detectBrowser();
    }

    detectBrowser() {
        const userAgent = navigator.userAgent;
        const vendor = navigator.vendor;
        
        if (userAgent.includes('Chrome') && vendor.includes('Google')) {
            return { name: 'Chrome', engine: 'Blink' };
        } else if (userAgent.includes('Firefox')) {
            return { name: 'Firefox', engine: 'Gecko' };
        } else if (userAgent.includes('Safari') && vendor.includes('Apple')) {
            return { name: 'Safari', engine: 'WebKit' };
        } else if (userAgent.includes('Edg')) {
            return { name: 'Edge', engine: 'Blink' };
        } else if (userAgent.includes('Trident') || userAgent.includes('MSIE')) {
            return { name: 'Internet Explorer', engine: 'Trident' };
        }
        return { name: 'Unknown', engine: 'Unknown' };
    }

    // Test CSS positioning consistency
    async testCSSPositioningConsistency() {
        const tests = [];
        
        // Test 1: Basic absolute positioning
        tests.push(await this.testBasicAbsolutePositioning());
        
        // Test 2: Z-index stacking
        tests.push(await this.testZIndexStacking());
        
        // Test 3: Transform positioning
        tests.push(await this.testTransformPositioning());
        
        // Test 4: Calc() expressions
        tests.push(await this.testCalcExpressions());
        
        // Test 5: Viewport units
        tests.push(await this.testViewportUnits());
        
        return {
            category: 'CSS Positioning Consistency',
            browser: this.currentBrowser,
            tests: tests,
            passed: tests.every(t => t.passed),
            summary: `${tests.filter(t => t.passed).length}/${tests.length} tests passed`
        };
    }

    async testBasicAbsolutePositioning() {
        try {
            const testElement = document.createElement('div');
            testElement.style.position = 'absolute';
            testElement.style.top = '10px';
            testElement.style.right = '10px';
            testElement.style.width = '100px';
            testElement.style.height = '50px';
            testElement.style.backgroundColor = 'red';
            testElement.style.zIndex = '1000';
            
            document.body.appendChild(testElement);
            
            const computed = window.getComputedStyle(testElement);
            const rect = testElement.getBoundingClientRect();
            
            const passed = computed.position === 'absolute' && 
                          rect.width === 100 && 
                          rect.height === 50;
            
            document.body.removeChild(testElement);
            
            return {
                name: 'Basic Absolute Positioning',
                passed: passed,
                details: `Position: ${computed.position}, Dimensions: ${rect.width}x${rect.height}`,
                browserSpecific: this.getBrowserSpecificNotes('absolute-positioning')
            };
        } catch (error) {
            return {
                name: 'Basic Absolute Positioning',
                passed: false,
                details: `Error: ${error.message}`,
                browserSpecific: null
            };
        }
    }

    async testZIndexStacking() {
        try {
            const element1 = document.createElement('div');
            const element2 = document.createElement('div');
            
            element1.style.position = 'absolute';
            element1.style.zIndex = '1000';
            element1.style.top = '0';
            element1.style.left = '0';
            element1.style.width = '50px';
            element1.style.height = '50px';
            element1.style.backgroundColor = 'blue';
            
            element2.style.position = 'absolute';
            element2.style.zIndex = '1050';
            element2.style.top = '25px';
            element2.style.left = '25px';
            element2.style.width = '50px';
            element2.style.height = '50px';
            element2.style.backgroundColor = 'red';
            
            document.body.appendChild(element1);
            document.body.appendChild(element2);
            
            const computed1 = window.getComputedStyle(element1);
            const computed2 = window.getComputedStyle(element2);
            
            const passed = parseInt(computed2.zIndex) > parseInt(computed1.zIndex);
            
            document.body.removeChild(element1);
            document.body.removeChild(element2);
            
            return {
                name: 'Z-Index Stacking',
                passed: passed,
                details: `Element1 z-index: ${computed1.zIndex}, Element2 z-index: ${computed2.zIndex}`,
                browserSpecific: this.getBrowserSpecificNotes('z-index')
            };
        } catch (error) {
            return {
                name: 'Z-Index Stacking',
                passed: false,
                details: `Error: ${error.message}`,
                browserSpecific: null
            };
        }
    }

    async testTransformPositioning() {
        try {
            const element = document.createElement('div');
            element.style.position = 'absolute';
            element.style.left = '50%';
            element.style.transform = 'translateX(-50%)';
            element.style.width = '100px';
            element.style.height = '50px';
            element.style.backgroundColor = 'green';
            
            document.body.appendChild(element);
            
            const computed = window.getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            
            // Check if transform is applied
            const hasTransform = computed.transform !== 'none' && computed.transform !== '';
            
            document.body.removeChild(element);
            
            return {
                name: 'Transform Positioning',
                passed: hasTransform,
                details: `Transform: ${computed.transform}`,
                browserSpecific: this.getBrowserSpecificNotes('transforms')
            };
        } catch (error) {
            return {
                name: 'Transform Positioning',
                passed: false,
                details: `Error: ${error.message}`,
                browserSpecific: null
            };
        }
    }

    async testCalcExpressions() {
        try {
            const element = document.createElement('div');
            element.style.position = 'absolute';
            element.style.width = 'calc(100% - 20px)';
            element.style.maxWidth = 'calc(100vw - 2rem)';
            element.style.top = 'calc(100% + 8px)';
            
            document.body.appendChild(element);
            
            const computed = window.getComputedStyle(element);
            
            // Check if calc expressions are computed
            const hasCalcWidth = computed.width !== 'calc(100% - 20px)';
            const hasCalcTop = computed.top !== 'calc(100% + 8px)';
            
            document.body.removeChild(element);
            
            return {
                name: 'Calc() Expressions',
                passed: hasCalcWidth && hasCalcTop,
                details: `Width: ${computed.width}, Top: ${computed.top}`,
                browserSpecific: this.getBrowserSpecificNotes('calc')
            };
        } catch (error) {
            return {
                name: 'Calc() Expressions',
                passed: false,
                details: `Error: ${error.message}`,
                browserSpecific: null
            };
        }
    }

    async testViewportUnits() {
        try {
            const element = document.createElement('div');
            element.style.position = 'absolute';
            element.style.width = '50vw';
            element.style.height = '25vh';
            element.style.maxWidth = '100vw';
            
            document.body.appendChild(element);
            
            const computed = window.getComputedStyle(element);
            const rect = element.getBoundingClientRect();
            
            // Check if viewport units are computed to pixel values
            const hasViewportWidth = rect.width > 0 && computed.width !== '50vw';
            const hasViewportHeight = rect.height > 0 && computed.height !== '25vh';
            
            document.body.removeChild(element);
            
            return {
                name: 'Viewport Units',
                passed: hasViewportWidth && hasViewportHeight,
                details: `Computed width: ${computed.width}, height: ${computed.height}`,
                browserSpecific: this.getBrowserSpecificNotes('viewport-units')
            };
        } catch (error) {
            return {
                name: 'Viewport Units',
                passed: false,
                details: `Error: ${error.message}`,
                browserSpecific: null
            };
        }
    }

    // Test JavaScript collision detection across engines
    async testJavaScriptCollisionDetection() {
        const tests = [];
        
        tests.push(await this.testGetBoundingClientRect());
        tests.push(await this.testCollisionMath());
        tests.push(await this.testViewportCalculations());
        tests.push(await this.testDynamicPositioning());
        
        return {
            category: 'JavaScript Collision Detection',
            browser: this.currentBrowser,
            tests: tests,
            passed: tests.every(t => t.passed),
            summary: `${tests.filter(t => t.passed).length}/${tests.length} tests passed`
        };
    }

    async testGetBoundingClientRect() {
        try {
            const element = document.createElement('div');
            element.style.position = 'absolute';
            element.style.top = '100px';
            element.style.left = '50px';
            element.style.width = '200px';
            element.style.height = '100px';
            
            document.body.appendChild(element);
            
            const rect = element.getBoundingClientRect();
            
            const passed = rect && 
                          typeof rect.top === 'number' &&
                          typeof rect.left === 'number' &&
                          typeof rect.width === 'number' &&
                          typeof rect.height === 'number' &&
                          rect.width === 200 &&
                          rect.height === 100;
            
            document.body.removeChild(element);
            
            return {
                name: 'getBoundingClientRect Support',
                passed: passed,
                details: `Rect: ${JSON.stringify(rect)}`,
                browserSpecific: this.getBrowserSpecificNotes('bounding-rect')
            };
        } catch (error) {
            return {
                name: 'getBoundingClientRect Support',
                passed: false,
                details: `Error: ${error.message}`,
                browserSpecific: null
            };
        }
    }

    async testCollisionMath() {
        try {
            // Create two overlapping elements
            const element1 = { top: 10, left: 10, right: 110, bottom: 60 };
            const element2 = { top: 50, left: 50, right: 150, bottom: 100 };
            
            // Test collision detection logic
            const hasCollision = !(element1.right < element2.left || 
                                  element1.left > element2.right || 
                                  element1.bottom < element2.top || 
                                  element1.top > element2.bottom);
            
            // Test non-overlapping elements
            const element3 = { top: 200, left: 200, right: 300, bottom: 250 };
            const noCollision = !(element1.right < element3.left || 
                                 element1.left > element3.right || 
                                 element1.bottom < element3.top || 
                                 element1.top > element3.bottom);
            
            return {
                name: 'Collision Math Logic',
                passed: hasCollision && !noCollision,
                details: `Overlapping: ${hasCollision}, Non-overlapping: ${!noCollision}`,
                browserSpecific: this.getBrowserSpecificNotes('collision-math')
            };
        } catch (error) {
            return {
                name: 'Collision Math Logic',
                passed: false,
                details: `Error: ${error.message}`,
                browserSpecific: null
            };
        }
    }

    async testViewportCalculations() {
        try {
            const viewportWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
            const viewportHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
            
            const passed = viewportWidth > 0 && viewportHeight > 0;
            
            return {
                name: 'Viewport Calculations',
                passed: passed,
                details: `Viewport: ${viewportWidth}x${viewportHeight}`,
                browserSpecific: this.getBrowserSpecificNotes('viewport-calc')
            };
        } catch (error) {
            return {
                name: 'Viewport Calculations',
                passed: false,
                details: `Error: ${error.message}`,
                browserSpecific: null
            };
        }
    }

    async testDynamicPositioning() {
        try {
            const element = document.createElement('div');
            element.style.position = 'absolute';
            element.style.width = '100px';
            element.style.height = '50px';
            
            document.body.appendChild(element);
            
            // Test dynamic position changes
            element.style.top = '10px';
            element.style.left = '10px';
            let rect1 = element.getBoundingClientRect();
            
            element.style.top = '50px';
            element.style.left = '50px';
            let rect2 = element.getBoundingClientRect();
            
            const positionChanged = rect1.top !== rect2.top && rect1.left !== rect2.left;
            
            document.body.removeChild(element);
            
            return {
                name: 'Dynamic Positioning',
                passed: positionChanged,
                details: `Position 1: ${rect1.top},${rect1.left} -> Position 2: ${rect2.top},${rect2.left}`,
                browserSpecific: this.getBrowserSpecificNotes('dynamic-positioning')
            };
        } catch (error) {
            return {
                name: 'Dynamic Positioning',
                passed: false,
                details: `Error: ${error.message}`,
                browserSpecific: null
            };
        }
    }

    // Test fallback positioning for older browsers
    async testFallbackPositioning() {
        const tests = [];
        
        tests.push(await this.testBasicFallback());
        tests.push(await this.testLegacyEventHandling());
        tests.push(await this.testGracefulDegradation());
        
        return {
            category: 'Fallback Positioning',
            browser: this.currentBrowser,
            tests: tests,
            passed: tests.every(t => t.passed),
            summary: `${tests.filter(t => t.passed).length}/${tests.length} tests passed`
        };
    }

    async testBasicFallback() {
        try {
            const element = document.createElement('div');
            element.style.position = 'absolute';
            element.style.top = '100px';
            element.style.right = '10px';
            element.style.zIndex = '1000';
            
            document.body.appendChild(element);
            
            // Use legacy style access if available
            const style = element.currentStyle || window.getComputedStyle(element);
            const passed = style.position === 'absolute' && style.zIndex === '1000';
            
            document.body.removeChild(element);
            
            return {
                name: 'Basic Fallback Positioning',
                passed: passed,
                details: `Position: ${style.position}, Z-index: ${style.zIndex}`,
                browserSpecific: this.getBrowserSpecificNotes('fallback')
            };
        } catch (error) {
            return {
                name: 'Basic Fallback Positioning',
                passed: false,
                details: `Error: ${error.message}`,
                browserSpecific: null
            };
        }
    }

    async testLegacyEventHandling() {
        try {
            const element = document.createElement('div');
            let eventFired = false;
            
            // Test modern event handling
            if (element.addEventListener) {
                element.addEventListener('click', () => { eventFired = true; });
            }
            // Test legacy event handling
            else if (element.attachEvent) {
                element.attachEvent('onclick', () => { eventFired = true; });
            }
            
            // Simulate click
            if (element.click) {
                element.click();
            }
            
            return {
                name: 'Legacy Event Handling',
                passed: eventFired,
                details: `Event fired: ${eventFired}`,
                browserSpecific: this.getBrowserSpecificNotes('events')
            };
        } catch (error) {
            return {
                name: 'Legacy Event Handling',
                passed: false,
                details: `Error: ${error.message}`,
                browserSpecific: null
            };
        }
    }

    async testGracefulDegradation() {
        try {
            // Test if basic positioning works without modern features
            const element = document.createElement('div');
            element.style.position = 'absolute';
            element.style.top = '10px';
            element.style.right = '10px';
            
            // Don't use modern features like transforms or calc
            document.body.appendChild(element);
            
            const rect = element.getBoundingClientRect();
            const hasPosition = rect.top > 0 && rect.right > 0;
            
            document.body.removeChild(element);
            
            return {
                name: 'Graceful Degradation',
                passed: hasPosition,
                details: `Element positioned at: ${rect.top}, ${rect.right}`,
                browserSpecific: this.getBrowserSpecificNotes('degradation')
            };
        } catch (error) {
            return {
                name: 'Graceful Degradation',
                passed: false,
                details: `Error: ${error.message}`,
                browserSpecific: null
            };
        }
    }

    getBrowserSpecificNotes(feature) {
        const notes = {
            'Chrome': {
                'absolute-positioning': 'Chrome handles absolute positioning consistently',
                'z-index': 'Z-index stacking context works as expected',
                'transforms': 'Full CSS3 transform support',
                'calc': 'Full calc() expression support',
                'viewport-units': 'Full viewport unit support',
                'bounding-rect': 'getBoundingClientRect fully supported',
                'collision-math': 'JavaScript math operations work correctly',
                'viewport-calc': 'Multiple viewport dimension methods available',
                'dynamic-positioning': 'Dynamic position changes work smoothly',
                'fallback': 'Modern features available, fallback not needed',
                'events': 'addEventListener fully supported',
                'degradation': 'Modern features available'
            },
            'Firefox': {
                'absolute-positioning': 'Firefox handles absolute positioning well',
                'z-index': 'Z-index behavior consistent with spec',
                'transforms': 'CSS transforms fully supported',
                'calc': 'calc() expressions work correctly',
                'viewport-units': 'Viewport units supported',
                'bounding-rect': 'getBoundingClientRect works correctly',
                'collision-math': 'Math operations consistent',
                'viewport-calc': 'Viewport calculations accurate',
                'dynamic-positioning': 'Position updates work well',
                'fallback': 'Modern features supported',
                'events': 'Event handling works correctly',
                'degradation': 'Good fallback behavior'
            },
            'Safari': {
                'absolute-positioning': 'Safari positioning works well',
                'z-index': 'Z-index stacking supported',
                'transforms': 'CSS transforms supported with -webkit- prefix in older versions',
                'calc': 'calc() supported',
                'viewport-units': 'Viewport units supported',
                'bounding-rect': 'getBoundingClientRect available',
                'collision-math': 'Math operations work correctly',
                'viewport-calc': 'Viewport dimensions accessible',
                'dynamic-positioning': 'Dynamic positioning supported',
                'fallback': 'WebKit-specific prefixes may be needed',
                'events': 'Event handling supported',
                'degradation': 'Good progressive enhancement'
            },
            'Edge': {
                'absolute-positioning': 'Edge (Chromium) handles positioning well',
                'z-index': 'Z-index works correctly',
                'transforms': 'Full transform support',
                'calc': 'calc() expressions supported',
                'viewport-units': 'Viewport units work correctly',
                'bounding-rect': 'getBoundingClientRect fully supported',
                'collision-math': 'JavaScript operations consistent',
                'viewport-calc': 'Viewport calculations work',
                'dynamic-positioning': 'Dynamic updates supported',
                'fallback': 'Modern features available',
                'events': 'addEventListener supported',
                'degradation': 'Modern browser capabilities'
            },
            'Internet Explorer': {
                'absolute-positioning': 'IE has some positioning quirks, test thoroughly',
                'z-index': 'Z-index can have stacking context issues',
                'transforms': 'Limited or no transform support in older versions',
                'calc': 'calc() not supported in IE8 and below',
                'viewport-units': 'Viewport units not supported in IE8 and below',
                'bounding-rect': 'getBoundingClientRect available in IE9+',
                'collision-math': 'Math operations work but may need polyfills',
                'viewport-calc': 'Use document.documentElement.clientWidth/Height',
                'dynamic-positioning': 'May need to trigger layout updates',
                'fallback': 'Fallback positioning essential',
                'events': 'Use attachEvent for IE8 and below',
                'degradation': 'Requires extensive fallback code'
            }
        };
        
        return notes[this.currentBrowser.name]?.[feature] || 'No specific notes available';
    }

    // Generate comprehensive test report
    async generateTestReport() {
        const results = {
            browser: this.currentBrowser,
            timestamp: new Date().toISOString(),
            tests: {}
        };
        
        console.log(`Running cross-browser tests for ${this.currentBrowser.name}...`);
        
        // Run all test categories
        results.tests.cssPositioning = await this.testCSSPositioningConsistency();
        results.tests.jsCollisionDetection = await this.testJavaScriptCollisionDetection();
        results.tests.fallbackPositioning = await this.testFallbackPositioning();
        
        // Calculate overall results
        const allTests = Object.values(results.tests);
        const totalPassed = allTests.filter(category => category.passed).length;
        const totalCategories = allTests.length;
        
        results.summary = {
            categoriesPassed: totalPassed,
            totalCategories: totalCategories,
            overallPassed: totalPassed === totalCategories,
            details: allTests.map(category => ({
                name: category.category,
                passed: category.passed,
                summary: category.summary
            }))
        };
        
        console.log(`Cross-browser tests completed: ${totalPassed}/${totalCategories} categories passed`);
        
        return results;
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CrossBrowserTestRunner;
}

// Global function for manual testing
async function runCrossBrowserTests() {
    const runner = new CrossBrowserTestRunner();
    return await runner.generateTestReport();
}