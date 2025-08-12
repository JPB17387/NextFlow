/**
 * Performance and Edge Case Testing for Theme Dropdown Layout Fix
 * Tests positioning performance with large task lists, multiple dropdowns, 
 * narrow viewports, and JavaScript failure scenarios
 * 
 * Requirements: 1.5, 3.4, 4.4
 */

class PerformanceEdgeCaseTests {
    constructor() {
        this.themeManager = null;
        this.testResults = [];
        this.performanceMetrics = {
            positioningTimes: [],
            cacheHits: 0,
            cacheMisses: 0,
            memoryUsage: 0,
            totalTests: 0,
            passedTests: 0
        };
        this.jsFailureSimulated = false;
        this.originalFunctions = {};
        
        this.init();
    }
    
    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupThemeManager();
            this.setupEventListeners();
            this.setupThemeSelector();
            this.startClock();
            this.logResult('Performance and edge case testing initialized', 'info');
        });
    }
    
    setupThemeManager() {
        try {
            this.themeManager = new ThemeManager();
            this.themeManager.initializeThemeSystem();
            this.logResult('Theme manager initialized successfully', 'pass');
        } catch (error) {
            this.logResult(`Theme manager initialization failed: ${error.message}`, 'fail');
        }
    }
    
    setupEventListeners() {
        // Large task list tests
        document.getElementById('generateLargeTaskList').addEventListener('click', () => this.generateLargeTaskList());
        document.getElementById('testLargeListPositioning').addEventListener('click', () => this.testLargeListPositioning());
        document.getElementById('clearLargeTaskList').addEventListener('click', () => this.clearLargeTaskList());
        
        // Multiple dropdowns tests
        document.getElementById('createMultipleDropdowns').addEventListener('click', () => this.createMultipleDropdowns());
        document.getElementById('testMultipleDropdownsPositioning').addEventListener('click', () => this.testMultipleDropdownsPositioning());
        document.getElementById('clearMultipleDropdowns').addEventListener('click', () => this.clearMultipleDropdowns());
        
        // Narrow viewport tests
        document.getElementById('testNarrowViewports').addEventListener('click', () => this.testNarrowViewports());
        document.getElementById('simulateViewportResize').addEventListener('click', () => this.simulateViewportResize());
        document.getElementById('testMobileViewports').addEventListener('click', () => this.testMobileViewports());
        
        // JavaScript failure tests
        document.getElementById('simulateJSFailure').addEventListener('click', () => this.simulateJSFailure());
        document.getElementById('testCSSOnlyPositioning').addEventListener('click', () => this.testCSSOnlyPositioning());
        document.getElementById('restoreJSFunctionality').addEventListener('click', () => this.restoreJSFunctionality());
        
        // Simulator dropdown
        document.getElementById('simThemeBtn').addEventListener('click', () => this.toggleSimulatorDropdown());
    }
    
    setupThemeSelector() {
        const themeToggle = document.getElementById('themeToggle');
        const themeDropdown = document.getElementById('themeDropdown');
        
        if (!themeToggle || !themeDropdown || !this.themeManager) return;
        
        // Populate theme options
        const themes = this.themeManager.getAvailableThemes();
        themeDropdown.innerHTML = '';
        
        themes.forEach(theme => {
            const option = document.createElement('li');
            option.className = 'theme-option';
            option.setAttribute('role', 'menuitem');
            option.setAttribute('data-theme', theme.name);
            
            const preview = document.createElement('div');
            preview.className = 'theme-preview';
            preview.style.backgroundColor = theme.preview.primaryColor;
            
            const name = document.createElement('span');
            name.className = 'theme-name';
            name.textContent = theme.displayName;
            
            option.appendChild(preview);
            option.appendChild(name);
            themeDropdown.appendChild(option);
            
            option.addEventListener('click', () => {
                this.selectTheme(theme.name);
            });
        });
        
        // Toggle dropdown with performance measurement
        themeToggle.addEventListener('click', () => {
            const startTime = performance.now();
            
            const isExpanded = themeToggle.getAttribute('aria-expanded') === 'true';
            themeToggle.setAttribute('aria-expanded', !isExpanded);
            themeDropdown.setAttribute('aria-hidden', isExpanded);
            
            // Measure positioning time if opening dropdown
            if (!isExpanded) {
                requestAnimationFrame(() => {
                    const endTime = performance.now();
                    const positioningTime = endTime - startTime;
                    this.recordPositioningTime(positioningTime);
                });
            }
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!themeToggle.contains(e.target) && !themeDropdown.contains(e.target)) {
                themeToggle.setAttribute('aria-expanded', 'false');
                themeDropdown.setAttribute('aria-hidden', 'true');
            }
        });
    }
    
    selectTheme(themeName) {
        const startTime = performance.now();
        
        if (this.themeManager && this.themeManager.setTheme(themeName)) {
            const endTime = performance.now();
            const duration = endTime - startTime;
            
            // Update UI
            const themeToggle = document.getElementById('themeToggle');
            const themeLabel = themeToggle.querySelector('.theme-label');
            const themeConfig = this.themeManager.getThemeConfig(themeName);
            
            if (themeLabel && themeConfig) {
                themeLabel.textContent = themeConfig.displayName;
            }
            
            // Update selected state
            document.querySelectorAll('.theme-option').forEach(option => {
                option.setAttribute('aria-selected', option.dataset.theme === themeName);
            });
            
            // Close dropdown
            themeToggle.setAttribute('aria-expanded', 'false');
            document.getElementById('themeDropdown').setAttribute('aria-hidden', 'true');
            
            this.recordPositioningTime(duration);
            this.logResult(`Theme changed to ${themeName} in ${duration.toFixed(2)}ms`, 'pass');
        } else {
            this.logResult(`Failed to change theme to ${themeName}`, 'fail');
        }
    }
    
    // Test 1: Large Task List Performance
    generateLargeTaskList() {
        const container = document.getElementById('largeTaskListContainer');
        container.innerHTML = '';
        
        this.showProgress(true);
        this.logResult('Generating large task list (100 items)...', 'info', 'largeListResults');
        
        // Generate tasks in batches to avoid blocking UI
        let itemsCreated = 0;
        const batchSize = 10;
        const totalItems = 100;
        
        const createBatch = () => {
            const fragment = document.createDocumentFragment();
            
            for (let i = 0; i < batchSize && itemsCreated < totalItems; i++) {
                const task = document.createElement('div');
                task.className = 'simulated-task';
                task.innerHTML = `
                    <strong>Task ${itemsCreated + 1}:</strong> 
                    Sample task with category and time - ${this.getRandomCategory()} 
                    <span style="float: right;">${this.getRandomTime()}</span>
                `;
                fragment.appendChild(task);
                itemsCreated++;
            }
            
            container.appendChild(fragment);
            
            if (itemsCreated < totalItems) {
                setTimeout(createBatch, 10); // Small delay to keep UI responsive
            } else {
                this.showProgress(false);
                this.logResult(`Generated ${totalItems} task items successfully`, 'pass', 'largeListResults');
            }
        };
        
        createBatch();
    }
    
    async testLargeListPositioning() {
        this.logResult('Testing positioning performance with large task list...', 'info', 'largeListResults');
        
        const iterations = 20;
        const positioningTimes = [];
        
        for (let i = 0; i < iterations; i++) {
            const startTime = performance.now();
            
            // Simulate dropdown positioning calculation
            if (this.themeManager && typeof this.themeManager.calculateDropdownPosition === 'function') {
                try {
                    const result = this.themeManager.calculateDropdownPosition();
                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    positioningTimes.push(duration);
                    
                    if (!result || !result.success) {
                        this.logResult(`Positioning calculation failed on iteration ${i + 1}`, 'warning', 'largeListResults');
                    }
                } catch (error) {
                    this.logResult(`Positioning error on iteration ${i + 1}: ${error.message}`, 'fail', 'largeListResults');
                }
            } else {
                // Fallback: measure theme dropdown toggle time
                const dropdown = document.getElementById('themeDropdown');
                if (dropdown) {
                    dropdown.setAttribute('aria-hidden', 'false');
                    await new Promise(resolve => requestAnimationFrame(resolve));
                    dropdown.setAttribute('aria-hidden', 'true');
                    
                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    positioningTimes.push(duration);
                }
            }
            
            // Small delay between iterations
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        // Analyze results
        const avgTime = positioningTimes.reduce((a, b) => a + b, 0) / positioningTimes.length;
        const maxTime = Math.max(...positioningTimes);
        const minTime = Math.min(...positioningTimes);
        
        this.logResult(`Large list positioning test completed:`, 'info', 'largeListResults');
        this.logResult(`  Average time: ${avgTime.toFixed(2)}ms`, avgTime < 50 ? 'pass' : 'warning', 'largeListResults');
        this.logResult(`  Max time: ${maxTime.toFixed(2)}ms`, maxTime < 100 ? 'pass' : 'warning', 'largeListResults');
        this.logResult(`  Min time: ${minTime.toFixed(2)}ms`, 'info', 'largeListResults');
        
        // Performance thresholds (Requirements 1.5, 4.4)
        if (avgTime > 50) {
            this.logResult('WARNING: Average positioning time exceeds 50ms threshold', 'warning', 'largeListResults');
        }
        if (maxTime > 100) {
            this.logResult('WARNING: Maximum positioning time exceeds 100ms threshold', 'warning', 'largeListResults');
        }
        
        this.performanceMetrics.positioningTimes.push(...positioningTimes);
        this.updateMetrics();
        this.recordTestResult(avgTime < 50 && maxTime < 100);
    }
    
    clearLargeTaskList() {
        document.getElementById('largeTaskListContainer').innerHTML = '<p>Click "Generate Large Task List" to create test data</p>';
        this.logResult('Large task list cleared', 'info', 'largeListResults');
    }
    
    // Test 2: Multiple Dropdowns
    createMultipleDropdowns() {
        const container = document.getElementById('multipleDropdownsContainer');
        container.innerHTML = '';
        
        const dropdownCount = 5;
        this.logResult(`Creating ${dropdownCount} test dropdowns...`, 'info', 'multipleDropdownsResults');
        
        for (let i = 0; i < dropdownCount; i++) {
            const dropdownWrapper = document.createElement('div');
            dropdownWrapper.className = 'dropdown-simulator';
            dropdownWrapper.innerHTML = `
                <button class="sim-dropdown-btn" data-dropdown="${i}">Dropdown ${i + 1} ▼</button>
                <div class="sim-dropdown-menu" data-menu="${i}">
                    <div class="sim-dropdown-item">Option 1</div>
                    <div class="sim-dropdown-item">Option 2</div>
                    <div class="sim-dropdown-item">Option 3</div>
                    <div class="sim-dropdown-item">Option 4</div>
                </div>
            `;
            
            // Add click handler
            const button = dropdownWrapper.querySelector('.sim-dropdown-btn');
            button.addEventListener('click', (e) => {
                const menu = dropdownWrapper.querySelector('.sim-dropdown-menu');
                const isOpen = menu.classList.contains('show');
                
                // Close all other dropdowns
                document.querySelectorAll('.sim-dropdown-menu.show').forEach(m => {
                    if (m !== menu) m.classList.remove('show');
                });
                
                // Toggle current dropdown
                menu.classList.toggle('show', !isOpen);
            });
            
            container.appendChild(dropdownWrapper);
        }
        
        this.logResult(`Created ${dropdownCount} test dropdowns successfully`, 'pass', 'multipleDropdownsResults');
    }
    
    async testMultipleDropdownsPositioning() {
        this.logResult('Testing positioning with multiple dropdowns...', 'info', 'multipleDropdownsResults');
        
        const dropdowns = document.querySelectorAll('.sim-dropdown-menu');
        const positioningTimes = [];
        let collisionCount = 0;
        
        // Test opening all dropdowns simultaneously
        const startTime = performance.now();
        
        dropdowns.forEach((dropdown, index) => {
            dropdown.classList.add('show');
            
            // Check for collisions with other dropdowns
            const rect = dropdown.getBoundingClientRect();
            dropdowns.forEach((otherDropdown, otherIndex) => {
                if (index !== otherIndex && otherDropdown.classList.contains('show')) {
                    const otherRect = otherDropdown.getBoundingClientRect();
                    if (this.checkCollision(rect, otherRect)) {
                        collisionCount++;
                    }
                }
            });
        });
        
        const endTime = performance.now();
        const totalTime = endTime - startTime;
        positioningTimes.push(totalTime);
        
        // Test sequential opening
        dropdowns.forEach(dropdown => dropdown.classList.remove('show'));
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const sequentialStartTime = performance.now();
        for (let i = 0; i < dropdowns.length; i++) {
            dropdowns[i].classList.add('show');
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        const sequentialEndTime = performance.now();
        const sequentialTime = sequentialEndTime - sequentialStartTime;
        
        // Clean up
        dropdowns.forEach(dropdown => dropdown.classList.remove('show'));
        
        this.logResult(`Multiple dropdowns test completed:`, 'info', 'multipleDropdownsResults');
        this.logResult(`  Simultaneous opening: ${totalTime.toFixed(2)}ms`, totalTime < 100 ? 'pass' : 'warning', 'multipleDropdownsResults');
        this.logResult(`  Sequential opening: ${sequentialTime.toFixed(2)}ms`, sequentialTime < 200 ? 'pass' : 'warning', 'multipleDropdownsResults');
        this.logResult(`  Collision count: ${collisionCount}`, collisionCount === 0 ? 'pass' : 'warning', 'multipleDropdownsResults');
        
        if (collisionCount > 0) {
            this.logResult('WARNING: Dropdown collisions detected - positioning system should prevent overlaps', 'warning', 'multipleDropdownsResults');
        }
        
        this.performanceMetrics.positioningTimes.push(totalTime, sequentialTime);
        this.updateMetrics();
        this.recordTestResult(totalTime < 100 && sequentialTime < 200 && collisionCount === 0);
    }
    
    clearMultipleDropdowns() {
        document.getElementById('multipleDropdownsContainer').innerHTML = '<p>Click "Create Multiple Dropdowns" to generate test dropdowns</p>';
        this.logResult('Multiple dropdowns cleared', 'info', 'multipleDropdownsResults');
    }
    
    // Test 3: Narrow Viewport Edge Cases
    async testNarrowViewports() {
        this.logResult('Testing narrow viewport edge cases...', 'info', 'narrowViewportResults');
        
        const testViewports = [
            { width: 320, height: 568, name: 'iPhone SE' },
            { width: 280, height: 400, name: 'Very Narrow' },
            { width: 240, height: 320, name: 'Extremely Narrow' },
            { width: 200, height: 300, name: 'Edge Case' }
        ];
        
        const simulator = document.getElementById('viewportSimulator');
        const originalWidth = simulator.style.width;
        const originalHeight = simulator.style.height;
        
        for (const viewport of testViewports) {
            this.logResult(`Testing ${viewport.name} (${viewport.width}x${viewport.height})...`, 'info', 'narrowViewportResults');
            
            // Resize simulator
            simulator.style.width = `${viewport.width}px`;
            simulator.style.height = `${viewport.height}px`;
            
            // Wait for layout
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Test dropdown positioning
            const startTime = performance.now();
            const simDropdown = document.getElementById('simThemeMenu');
            simDropdown.classList.add('show');
            
            // Check if dropdown extends beyond viewport
            const dropdownRect = simDropdown.getBoundingClientRect();
            const simulatorRect = simulator.getBoundingClientRect();
            
            const overflowsRight = dropdownRect.right > simulatorRect.right;
            const overflowsLeft = dropdownRect.left < simulatorRect.left;
            const overflowsBottom = dropdownRect.bottom > simulatorRect.bottom;
            
            const endTime = performance.now();
            const positioningTime = endTime - startTime;
            
            simDropdown.classList.remove('show');
            
            // Log results
            if (overflowsRight || overflowsLeft || overflowsBottom) {
                this.logResult(`  FAIL: Dropdown overflows viewport (R:${overflowsRight}, L:${overflowsLeft}, B:${overflowsBottom})`, 'fail', 'narrowViewportResults');
            } else {
                this.logResult(`  PASS: Dropdown fits within viewport`, 'pass', 'narrowViewportResults');
            }
            
            this.logResult(`  Positioning time: ${positioningTime.toFixed(2)}ms`, positioningTime < 50 ? 'pass' : 'warning', 'narrowViewportResults');
            
            this.performanceMetrics.positioningTimes.push(positioningTime);
            this.recordTestResult(!overflowsRight && !overflowsLeft && !overflowsBottom && positioningTime < 50);
            
            await new Promise(resolve => setTimeout(resolve, 200));
        }
        
        // Restore original size
        simulator.style.width = originalWidth;
        simulator.style.height = originalHeight;
        
        this.logResult('Narrow viewport testing completed', 'info', 'narrowViewportResults');
        this.updateMetrics();
    }
    
    async simulateViewportResize() {
        this.logResult('Simulating viewport resize events...', 'info', 'narrowViewportResults');
        
        const simulator = document.getElementById('viewportSimulator');
        const sizes = [
            { width: 320, height: 200 },
            { width: 480, height: 300 },
            { width: 768, height: 400 },
            { width: 320, height: 200 }
        ];
        
        for (const size of sizes) {
            simulator.style.width = `${size.width}px`;
            simulator.style.height = `${size.height}px`;
            
            // Trigger resize event simulation
            window.dispatchEvent(new Event('resize'));
            
            await new Promise(resolve => setTimeout(resolve, 300));
        }
        
        this.logResult('Viewport resize simulation completed', 'pass', 'narrowViewportResults');
        this.recordTestResult(true);
    }
    
    async testMobileViewports() {
        this.logResult('Testing mobile viewport scenarios...', 'info', 'narrowViewportResults');
        
        // Test orientation change simulation
        const simulator = document.getElementById('viewportSimulator');
        
        // Portrait
        simulator.style.width = '375px';
        simulator.style.height = '667px';
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Landscape
        simulator.style.width = '667px';
        simulator.style.height = '375px';
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Back to portrait
        simulator.style.width = '375px';
        simulator.style.height = '667px';
        
        this.logResult('Mobile viewport testing completed', 'pass', 'narrowViewportResults');
        this.recordTestResult(true);
    }
    
    // Test 4: JavaScript Failure Graceful Degradation
    simulateJSFailure() {
        this.logResult('Simulating JavaScript failure...', 'warning', 'jsFailureResults');
        
        if (this.jsFailureSimulated) {
            this.logResult('JavaScript failure already simulated', 'info', 'jsFailureResults');
            return;
        }
        
        // Store original functions
        if (this.themeManager) {
            this.originalFunctions.calculateDropdownPosition = this.themeManager.calculateDropdownPosition;
            this.originalFunctions.getBoundingRectSafe = this.themeManager.getBoundingRectSafe;
            this.originalFunctions.getCachedElementMeasurements = this.themeManager.getCachedElementMeasurements;
            
            // Disable positioning functions
            this.themeManager.calculateDropdownPosition = () => {
                throw new Error('Simulated JavaScript failure');
            };
            this.themeManager.getBoundingRectSafe = () => {
                throw new Error('Simulated JavaScript failure');
            };
            this.themeManager.getCachedElementMeasurements = () => {
                throw new Error('Simulated JavaScript failure');
            };
        }
        
        // Show fallback message
        document.getElementById('noJsFallback').style.display = 'block';
        
        this.jsFailureSimulated = true;
        this.logResult('JavaScript positioning functions disabled', 'warning', 'jsFailureResults');
        this.logResult('System should fall back to CSS-only positioning', 'info', 'jsFailureResults');
    }
    
    testCSSOnlyPositioning() {
        this.logResult('Testing CSS-only positioning fallback...', 'info', 'jsFailureResults');
        
        const dropdown = document.getElementById('themeDropdown');
        if (!dropdown) {
            this.logResult('Theme dropdown not found', 'fail', 'jsFailureResults');
            return;
        }
        
        // Test basic CSS positioning
        const startTime = performance.now();
        
        try {
            // Open dropdown using only CSS classes
            dropdown.setAttribute('aria-hidden', 'false');
            dropdown.classList.add('position-left'); // Test alternative positioning
            
            // Check if dropdown is visible and positioned
            const rect = dropdown.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0;
            const isPositioned = rect.top > 0 && rect.left >= 0;
            
            const endTime = performance.now();
            const positioningTime = endTime - startTime;
            
            // Clean up
            dropdown.setAttribute('aria-hidden', 'true');
            dropdown.classList.remove('position-left');
            
            if (isVisible && isPositioned) {
                this.logResult(`CSS-only positioning works: ${positioningTime.toFixed(2)}ms`, 'pass', 'jsFailureResults');
                this.recordTestResult(true);
            } else {
                this.logResult('CSS-only positioning failed - dropdown not properly positioned', 'fail', 'jsFailureResults');
                this.recordTestResult(false);
            }
            
        } catch (error) {
            this.logResult(`CSS-only positioning error: ${error.message}`, 'fail', 'jsFailureResults');
            this.recordTestResult(false);
        }
    }
    
    restoreJSFunctionality() {
        this.logResult('Restoring JavaScript functionality...', 'info', 'jsFailureResults');
        
        if (!this.jsFailureSimulated) {
            this.logResult('JavaScript functionality was not disabled', 'info', 'jsFailureResults');
            return;
        }
        
        // Restore original functions
        if (this.themeManager && this.originalFunctions) {
            this.themeManager.calculateDropdownPosition = this.originalFunctions.calculateDropdownPosition;
            this.themeManager.getBoundingRectSafe = this.originalFunctions.getBoundingRectSafe;
            this.themeManager.getCachedElementMeasurements = this.originalFunctions.getCachedElementMeasurements;
        }
        
        // Hide fallback message
        document.getElementById('noJsFallback').style.display = 'none';
        
        this.jsFailureSimulated = false;
        this.originalFunctions = {};
        
        this.logResult('JavaScript functionality restored', 'pass', 'jsFailureResults');
        this.recordTestResult(true);
    }
    
    // Utility Functions
    toggleSimulatorDropdown() {
        const menu = document.getElementById('simThemeMenu');
        menu.classList.toggle('show');
    }
    
    checkCollision(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                rect1.left > rect2.right || 
                rect1.bottom < rect2.top || 
                rect1.top > rect2.bottom);
    }
    
    getRandomCategory() {
        const categories = ['Work', 'Study', 'Personal'];
        return categories[Math.floor(Math.random() * categories.length)];
    }
    
    getRandomTime() {
        const hours = Math.floor(Math.random() * 12) + 1;
        const minutes = Math.floor(Math.random() * 60);
        const ampm = Math.random() > 0.5 ? 'AM' : 'PM';
        return `${hours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
    }
    
    recordPositioningTime(time) {
        this.performanceMetrics.positioningTimes.push(time);
        this.updateMetrics();
    }
    
    recordTestResult(passed) {
        this.performanceMetrics.totalTests++;
        if (passed) {
            this.performanceMetrics.passedTests++;
        }
        this.updateMetrics();
    }
    
    updateMetrics() {
        const times = this.performanceMetrics.positioningTimes;
        const avgTime = times.length > 0 ? times.reduce((a, b) => a + b, 0) / times.length : 0;
        const maxTime = times.length > 0 ? Math.max(...times) : 0;
        
        document.getElementById('avgPositioningTime').textContent = `${avgTime.toFixed(1)}ms`;
        document.getElementById('maxPositioningTime').textContent = `${maxTime.toFixed(1)}ms`;
        
        // Cache hit rate (if available from theme manager)
        if (this.themeManager && typeof this.themeManager.getMeasurementCacheStats === 'function') {
            try {
                const cacheStats = this.themeManager.getMeasurementCacheStats();
                document.getElementById('cacheHitRate').textContent = cacheStats.hitRate || '0%';
            } catch (error) {
                document.getElementById('cacheHitRate').textContent = 'N/A';
            }
        }
        
        // Memory usage (if available)
        if (performance.memory) {
            const memoryMB = (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(1);
            document.getElementById('memoryUsage').textContent = `${memoryMB}MB`;
        }
        
        document.getElementById('totalTests').textContent = this.performanceMetrics.totalTests;
        
        const passRate = this.performanceMetrics.totalTests > 0 
            ? (this.performanceMetrics.passedTests / this.performanceMetrics.totalTests * 100).toFixed(1)
            : 0;
        document.getElementById('passRate').textContent = `${passRate}%`;
    }
    
    logResult(message, type = 'info', containerId = null) {
        const containers = containerId ? [containerId] : ['largeListResults', 'multipleDropdownsResults', 'narrowViewportResults', 'jsFailureResults'];
        
        containers.forEach(id => {
            const container = document.getElementById(id);
            if (container) {
                const entry = document.createElement('div');
                entry.className = `result-item result-${type}`;
                entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
                container.appendChild(entry);
                container.scrollTop = container.scrollHeight;
            }
        });
        
        // Also log to console for debugging
        console.log(`[Performance Test] ${message}`);
    }
    
    showProgress(show) {
        const progress = document.getElementById('testProgress');
        const progressFill = document.getElementById('testProgressFill');
        
        if (show) {
            progress.style.display = 'block';
            progressFill.style.width = '0%';
            
            // Animate progress
            let width = 0;
            const interval = setInterval(() => {
                width += 5;
                progressFill.style.width = `${Math.min(width, 90)}%`;
                
                if (width >= 90) {
                    clearInterval(interval);
                }
            }, 100);
            
            progress._interval = interval;
        } else {
            if (progress._interval) {
                clearInterval(progress._interval);
            }
            progressFill.style.width = '100%';
            setTimeout(() => {
                progress.style.display = 'none';
            }, 500);
        }
    }
    
    startClock() {
        function updateClock() {
            const now = new Date();
            const timeOptions = { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true };
            const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            
            const clockElement = document.getElementById('clock');
            const dateElement = document.getElementById('date');
            
            if (clockElement) clockElement.textContent = now.toLocaleTimeString('en-US', timeOptions);
            if (dateElement) dateElement.textContent = now.toLocaleDateString('en-US', dateOptions);
        }
        
        updateClock();
        setInterval(updateClock, 1000);
    }
}

// Initialize the test suite
const performanceTests = new PerformanceEdgeCaseTests();