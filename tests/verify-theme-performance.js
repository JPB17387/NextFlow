// Theme System Performance Verification Script
// This script verifies that the theme system performance optimizations are working correctly

class ThemePerformanceVerifier {
    constructor() {
        this.results = {
            passed: 0,
            failed: 0,
            warnings: 0,
            tests: []
        };
    }

    /**
     * Run all performance verification tests
     */
    async runAllTests() {
        console.log('🚀 Starting Theme System Performance Verification...\n');
        
        // Test 1: Theme Manager Initialization Performance
        await this.testInitializationPerformance();
        
        // Test 2: Theme Change Performance
        await this.testThemeChangePerformance();
        
        // Test 3: Memory Usage Optimization
        await this.testMemoryOptimization();
        
        // Test 4: CSS Transition Optimization
        await this.testCSSTransitionOptimization();
        
        // Test 5: DOM Manipulation Efficiency
        await this.testDOMManipulationEfficiency();
        
        // Test 6: Event Listener Cleanup
        await this.testEventListenerCleanup();
        
        // Test 7: Performance Monitoring
        await this.testPerformanceMonitoring();
        
        // Test 8: Debouncing and Throttling
        await this.testDebouncingThrottling();
        
        // Generate final report
        this.generateReport();
    }

    /**
     * Test theme manager initialization performance
     */
    async testInitializationPerformance() {
        const testName = 'Theme Manager Initialization Performance';
        console.log(`📊 Testing: ${testName}`);
        
        try {
            const startTime = performance.now();
            const themeManager = new ThemeManager();
            const initSuccess = themeManager.initializeThemeSystem();
            const endTime = performance.now();
            
            const initTime = endTime - startTime;
            
            if (initSuccess && initTime < 100) { // Should initialize in under 100ms
                this.addTestResult(testName, 'PASS', `Initialized in ${initTime.toFixed(2)}ms`);
            } else if (initSuccess && initTime < 200) {
                this.addTestResult(testName, 'WARN', `Initialization took ${initTime.toFixed(2)}ms (acceptable but could be faster)`);
            } else {
                this.addTestResult(testName, 'FAIL', `Initialization took ${initTime.toFixed(2)}ms or failed`);
            }
            
            // Cleanup
            themeManager.cleanup();
            
        } catch (error) {
            this.addTestResult(testName, 'FAIL', `Error: ${error.message}`);
        }
    }

    /**
     * Test theme change performance
     */
    async testThemeChangePerformance() {
        const testName = 'Theme Change Performance';
        console.log(`📊 Testing: ${testName}`);
        
        try {
            const themeManager = new ThemeManager();
            themeManager.initializeThemeSystem();
            
            const themes = ['white', 'dark', 'student', 'developer', 'professional'];
            const changeTimes = [];
            
            // Test multiple theme changes
            for (let i = 0; i < 10; i++) {
                const theme = themes[i % themes.length];
                const startTime = performance.now();
                
                themeManager.setTheme(theme);
                
                // Wait for any async operations
                await new Promise(resolve => requestAnimationFrame(resolve));
                
                const endTime = performance.now();
                changeTimes.push(endTime - startTime);
            }
            
            const averageTime = changeTimes.reduce((a, b) => a + b, 0) / changeTimes.length;
            const maxTime = Math.max(...changeTimes);
            
            if (averageTime < 50 && maxTime < 100) {
                this.addTestResult(testName, 'PASS', `Average: ${averageTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms`);
            } else if (averageTime < 100 && maxTime < 200) {
                this.addTestResult(testName, 'WARN', `Average: ${averageTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms (acceptable but could be faster)`);
            } else {
                this.addTestResult(testName, 'FAIL', `Average: ${averageTime.toFixed(2)}ms, Max: ${maxTime.toFixed(2)}ms (too slow)`);
            }
            
            themeManager.cleanup();
            
        } catch (error) {
            this.addTestResult(testName, 'FAIL', `Error: ${error.message}`);
        }
    }

    /**
     * Test memory usage optimization
     */
    async testMemoryOptimization() {
        const testName = 'Memory Usage Optimization';
        console.log(`📊 Testing: ${testName}`);
        
        try {
            if (!performance.memory) {
                this.addTestResult(testName, 'WARN', 'Memory API not available in this browser');
                return;
            }
            
            const initialMemory = performance.memory.usedJSHeapSize;
            
            // Create and use theme manager
            const themeManager = new ThemeManager();
            themeManager.initializeThemeSystem();
            
            // Perform multiple operations
            for (let i = 0; i < 20; i++) {
                themeManager.setTheme(i % 2 === 0 ? 'dark' : 'white');
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            
            const afterOperationsMemory = performance.memory.usedJSHeapSize;
            
            // Cleanup and optimize
            themeManager.optimizePerformance();
            themeManager.cleanup();
            
            // Force garbage collection if available
            if (window.gc) {
                window.gc();
            }
            
            const finalMemory = performance.memory.usedJSHeapSize;
            
            const memoryIncrease = finalMemory - initialMemory;
            const memoryIncreaseKB = memoryIncrease / 1024;
            
            if (memoryIncreaseKB < 100) { // Less than 100KB increase
                this.addTestResult(testName, 'PASS', `Memory increase: ${memoryIncreaseKB.toFixed(2)}KB`);
            } else if (memoryIncreaseKB < 500) {
                this.addTestResult(testName, 'WARN', `Memory increase: ${memoryIncreaseKB.toFixed(2)}KB (acceptable but monitor)`);
            } else {
                this.addTestResult(testName, 'FAIL', `Memory increase: ${memoryIncreaseKB.toFixed(2)}KB (too high)`);
            }
            
        } catch (error) {
            this.addTestResult(testName, 'FAIL', `Error: ${error.message}`);
        }
    }

    /**
     * Test CSS transition optimization
     */
    async testCSSTransitionOptimization() {
        const testName = 'CSS Transition Optimization';
        console.log(`📊 Testing: ${testName}`);
        
        try {
            // Check if optimized CSS classes are present
            const styleSheets = Array.from(document.styleSheets);
            let hasOptimizedTransitions = false;
            let hasContainment = false;
            let hasHardwareAcceleration = false;
            
            for (const sheet of styleSheets) {
                try {
                    const rules = Array.from(sheet.cssRules || sheet.rules || []);
                    
                    for (const rule of rules) {
                        if (rule.cssText) {
                            // Check for optimized transitions
                            if (rule.cssText.includes('transition-duration: 0.15s')) {
                                hasOptimizedTransitions = true;
                            }
                            
                            // Check for CSS containment
                            if (rule.cssText.includes('contain: layout style')) {
                                hasContainment = true;
                            }
                            
                            // Check for hardware acceleration
                            if (rule.cssText.includes('transform: translate3d')) {
                                hasHardwareAcceleration = true;
                            }
                        }
                    }
                } catch (e) {
                    // Skip cross-origin stylesheets
                    continue;
                }
            }
            
            const optimizations = [];
            if (hasOptimizedTransitions) optimizations.push('Fast transitions');
            if (hasContainment) optimizations.push('CSS containment');
            if (hasHardwareAcceleration) optimizations.push('Hardware acceleration');
            
            if (optimizations.length >= 2) {
                this.addTestResult(testName, 'PASS', `Found optimizations: ${optimizations.join(', ')}`);
            } else if (optimizations.length === 1) {
                this.addTestResult(testName, 'WARN', `Some optimizations found: ${optimizations.join(', ')}`);
            } else {
                this.addTestResult(testName, 'FAIL', 'No CSS optimizations detected');
            }
            
        } catch (error) {
            this.addTestResult(testName, 'FAIL', `Error: ${error.message}`);
        }
    }

    /**
     * Test DOM manipulation efficiency
     */
    async testDOMManipulationEfficiency() {
        const testName = 'DOM Manipulation Efficiency';
        console.log(`📊 Testing: ${testName}`);
        
        try {
            const themeManager = new ThemeManager();
            themeManager.initializeThemeSystem();
            
            // Count DOM operations during theme change
            let domOperations = 0;
            const originalSetAttribute = Element.prototype.setAttribute;
            const originalRemoveAttribute = Element.prototype.removeAttribute;
            
            Element.prototype.setAttribute = function(...args) {
                domOperations++;
                return originalSetAttribute.apply(this, args);
            };
            
            Element.prototype.removeAttribute = function(...args) {
                domOperations++;
                return originalRemoveAttribute.apply(this, args);
            };
            
            // Perform theme change
            themeManager.setTheme('dark');
            
            // Restore original methods
            Element.prototype.setAttribute = originalSetAttribute;
            Element.prototype.removeAttribute = originalRemoveAttribute;
            
            if (domOperations <= 2) { // Should be minimal DOM operations
                this.addTestResult(testName, 'PASS', `${domOperations} DOM operations per theme change`);
            } else if (domOperations <= 5) {
                this.addTestResult(testName, 'WARN', `${domOperations} DOM operations (acceptable but could be optimized)`);
            } else {
                this.addTestResult(testName, 'FAIL', `${domOperations} DOM operations (too many)`);
            }
            
            themeManager.cleanup();
            
        } catch (error) {
            this.addTestResult(testName, 'FAIL', `Error: ${error.message}`);
        }
    }

    /**
     * Test event listener cleanup
     */
    async testEventListenerCleanup() {
        const testName = 'Event Listener Cleanup';
        console.log(`📊 Testing: ${testName}`);
        
        try {
            const themeManager = new ThemeManager();
            themeManager.initializeThemeSystem();
            
            // Check if cleanup method exists and works
            const hasCleanupMethod = typeof themeManager.cleanup === 'function';
            
            if (!hasCleanupMethod) {
                this.addTestResult(testName, 'FAIL', 'No cleanup method found');
                return;
            }
            
            // Test cleanup
            const cleanupResult = themeManager.cleanup();
            
            if (cleanupResult === true) {
                this.addTestResult(testName, 'PASS', 'Cleanup method executed successfully');
            } else {
                this.addTestResult(testName, 'FAIL', 'Cleanup method failed');
            }
            
        } catch (error) {
            this.addTestResult(testName, 'FAIL', `Error: ${error.message}`);
        }
    }

    /**
     * Test performance monitoring
     */
    async testPerformanceMonitoring() {
        const testName = 'Performance Monitoring';
        console.log(`📊 Testing: ${testName}`);
        
        try {
            const themeManager = new ThemeManager();
            themeManager.initializeThemeSystem();
            
            // Check if performance monitoring methods exist
            const hasGetMetrics = typeof themeManager.getPerformanceMetrics === 'function';
            const hasTestPerformance = typeof themeManager.testPerformance === 'function';
            const hasOptimize = typeof themeManager.optimizePerformance === 'function';
            
            if (hasGetMetrics && hasTestPerformance && hasOptimize) {
                // Test metrics collection
                const metrics = themeManager.getPerformanceMetrics();
                
                if (metrics && typeof metrics.themeChanges === 'number') {
                    this.addTestResult(testName, 'PASS', 'Performance monitoring is fully implemented');
                } else {
                    this.addTestResult(testName, 'WARN', 'Performance monitoring partially implemented');
                }
            } else {
                this.addTestResult(testName, 'FAIL', 'Performance monitoring methods missing');
            }
            
            themeManager.cleanup();
            
        } catch (error) {
            this.addTestResult(testName, 'FAIL', `Error: ${error.message}`);
        }
    }

    /**
     * Test debouncing and throttling
     */
    async testDebouncingThrottling() {
        const testName = 'Debouncing and Throttling';
        console.log(`📊 Testing: ${testName}`);
        
        try {
            const themeManager = new ThemeManager();
            themeManager.initializeThemeSystem();
            
            // Test rapid theme changes (should be debounced)
            const startTime = performance.now();
            
            // Rapid fire theme changes
            for (let i = 0; i < 10; i++) {
                themeManager.setTheme(i % 2 === 0 ? 'dark' : 'white');
            }
            
            const endTime = performance.now();
            const totalTime = endTime - startTime;
            
            // Should complete quickly due to debouncing/optimization
            if (totalTime < 100) {
                this.addTestResult(testName, 'PASS', `Rapid changes handled in ${totalTime.toFixed(2)}ms`);
            } else if (totalTime < 200) {
                this.addTestResult(testName, 'WARN', `Rapid changes took ${totalTime.toFixed(2)}ms (acceptable)`);
            } else {
                this.addTestResult(testName, 'FAIL', `Rapid changes took ${totalTime.toFixed(2)}ms (too slow)`);
            }
            
            themeManager.cleanup();
            
        } catch (error) {
            this.addTestResult(testName, 'FAIL', `Error: ${error.message}`);
        }
    }

    /**
     * Add test result
     */
    addTestResult(testName, status, details) {
        const result = { testName, status, details };
        this.results.tests.push(result);
        
        switch (status) {
            case 'PASS':
                this.results.passed++;
                console.log(`✅ ${testName}: ${details}`);
                break;
            case 'WARN':
                this.results.warnings++;
                console.log(`⚠️  ${testName}: ${details}`);
                break;
            case 'FAIL':
                this.results.failed++;
                console.log(`❌ ${testName}: ${details}`);
                break;
        }
        console.log('');
    }

    /**
     * Generate final report
     */
    generateReport() {
        console.log('📋 THEME SYSTEM PERFORMANCE VERIFICATION REPORT');
        console.log('================================================');
        console.log(`✅ Passed: ${this.results.passed}`);
        console.log(`⚠️  Warnings: ${this.results.warnings}`);
        console.log(`❌ Failed: ${this.results.failed}`);
        console.log(`📊 Total Tests: ${this.results.tests.length}`);
        console.log('');
        
        const passRate = (this.results.passed / this.results.tests.length) * 100;
        
        if (passRate >= 80) {
            console.log(`🎉 Overall Status: EXCELLENT (${passRate.toFixed(1)}% pass rate)`);
        } else if (passRate >= 60) {
            console.log(`👍 Overall Status: GOOD (${passRate.toFixed(1)}% pass rate)`);
        } else {
            console.log(`⚠️  Overall Status: NEEDS IMPROVEMENT (${passRate.toFixed(1)}% pass rate)`);
        }
        
        console.log('');
        console.log('Detailed Results:');
        console.log('-----------------');
        
        this.results.tests.forEach((test, index) => {
            const statusIcon = test.status === 'PASS' ? '✅' : test.status === 'WARN' ? '⚠️' : '❌';
            console.log(`${index + 1}. ${statusIcon} ${test.testName}`);
            console.log(`   ${test.details}`);
        });
        
        return this.results;
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ThemePerformanceVerifier;
}

// Auto-run if loaded directly in browser
if (typeof window !== 'undefined' && window.document) {
    window.ThemePerformanceVerifier = ThemePerformanceVerifier;
    
    // Auto-run verification when page loads
    document.addEventListener('DOMContentLoaded', async () => {
        if (window.location.search.includes('autorun=true')) {
            const verifier = new ThemePerformanceVerifier();
            await verifier.runAllTests();
        }
    });
}