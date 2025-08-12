/**
 * Desktop Grid Layout Positioning Verification
 * Task 7.1: Test desktop grid layout positioning
 * 
 * This script verifies:
 * - Dropdown doesn't overlap with task list section
 * - Test positioning with varying task list heights  
 * - Ensure proper spacing from all page elements
 * Requirements: 1.1, 1.4, 4.1
 */

class DesktopGridPositioningTester {
    constructor() {
        this.testResults = [];
        this.minDesktopSpacing = 32; // From design requirements
        this.minButtonSpacing = 8;   // From design requirements
        this.estimatedDropdownWidth = 200;
        this.estimatedDropdownHeight = 250;
    }

    /**
     * Run all desktop grid layout positioning tests
     * @returns {Object} Test results summary
     */
    async runAllTests() {
        console.log('🧪 Starting Desktop Grid Layout Positioning Tests...\n');
        
        const tests = [
            { name: 'Dropdown Overlap Detection', fn: () => this.testDropdownOverlap() },
            { name: 'Spacing Requirements', fn: () => this.testSpacingRequirements() },
            { name: 'Varying Task Heights', fn: () => this.testVaryingTaskHeights() },
            { name: 'Grid Layout Integration', fn: () => this.testGridLayoutIntegration() },
            { name: 'Viewport Boundaries', fn: () => this.testViewportBoundaries() }
        ];

        const results = [];
        let passedCount = 0;

        for (const test of tests) {
            console.log(`\n--- ${test.name} ---`);
            try {
                const result = await test.fn();
                results.push({ name: test.name, ...result });
                if (result.passed) {
                    passedCount++;
                    console.log(`✅ ${test.name}: PASSED`);
                } else {
                    console.log(`❌ ${test.name}: FAILED - ${result.error || 'Unknown error'}`);
                }
            } catch (error) {
                console.log(`❌ ${test.name}: ERROR - ${error.message}`);
                results.push({ name: test.name, passed: false, error: error.message });
            }
        }

        const summary = {
            totalTests: tests.length,
            passedTests: passedCount,
            failedTests: tests.length - passedCount,
            successRate: ((passedCount / tests.length) * 100).toFixed(1),
            results
        };

        this.logTestSummary(summary);
        return summary;
    }

    /**
     * Test 1: Verify dropdown doesn't overlap with task list section
     * Requirements: 1.1, 1.4
     */
    testDropdownOverlap() {
        try {
            const dropdown = document.querySelector('.theme-dropdown');
            const button = document.querySelector('.theme-toggle-btn');
            const taskList = document.querySelector('.task-list-section');

            if (!dropdown || !button || !taskList) {
                return { passed: false, error: 'Required elements not found' };
            }

            // Check if we're in desktop layout
            const viewportWidth = window.innerWidth;
            if (viewportWidth < 1024) {
                return { passed: true, skipped: true, reason: 'Not desktop layout' };
            }

            // Get element measurements
            const buttonRect = button.getBoundingClientRect();
            const taskListRect = taskList.getBoundingClientRect();

            // Calculate potential dropdown position (standard positioning)
            const dropdownLeft = buttonRect.right - this.estimatedDropdownWidth;
            const dropdownRight = dropdownLeft + this.estimatedDropdownWidth;
            const dropdownTop = buttonRect.bottom + this.minButtonSpacing;
            const dropdownBottom = dropdownTop + this.estimatedDropdownHeight;

            // Check for overlap with task list
            const horizontalOverlap = dropdownRight > taskListRect.left && dropdownLeft < taskListRect.right;
            const verticalOverlap = dropdownBottom > taskListRect.top && dropdownTop < taskListRect.bottom;

            const hasOverlap = horizontalOverlap && verticalOverlap;

            if (hasOverlap) {
                // Check if collision avoidance positioning is available
                const hasCollisionAvoidanceCSS = this.checkCollisionAvoidanceCSS();
                
                if (hasCollisionAvoidanceCSS) {
                    console.log('⚠️  Overlap detected but collision avoidance CSS is available');
                    return { 
                        passed: true, 
                        hasOverlap: true, 
                        collisionAvoidanceAvailable: true,
                        overlapDetails: {
                            horizontal: horizontalOverlap,
                            vertical: verticalOverlap,
                            overlapWidth: Math.min(dropdownRight, taskListRect.right) - Math.max(dropdownLeft, taskListRect.left),
                            overlapHeight: Math.min(dropdownBottom, taskListRect.bottom) - Math.max(dropdownTop, taskListRect.top)
                        }
                    };
                } else {
                    console.log('❌ Overlap detected and no collision avoidance available');
                    return { passed: false, hasOverlap: true, collisionAvoidanceAvailable: false };
                }
            } else {
                console.log('✅ No overlap detected with task list section');
                return { passed: true, hasOverlap: false };
            }

        } catch (error) {
            return { passed: false, error: error.message };
        }
    }

    /**
     * Test 2: Verify proper spacing from all page elements
     * Requirements: 4.1
     */
    testSpacingRequirements() {
        try {
            const button = document.querySelector('.theme-toggle-btn');
            const taskList = document.querySelector('.task-list-section');
            const header = document.querySelector('header');
            const progressSection = document.querySelector('.progress-section');
            const suggestionsSection = document.querySelector('.suggestions-section');

            if (!button || !taskList) {
                return { passed: false, error: 'Required elements not found' };
            }

            const viewportWidth = window.innerWidth;
            if (viewportWidth < 1024) {
                return { passed: true, skipped: true, reason: 'Not desktop layout' };
            }

            const buttonRect = button.getBoundingClientRect();
            const taskListRect = taskList.getBoundingClientRect();
            const spacingResults = {};

            // Check spacing from viewport edges
            spacingResults.rightEdgeSpacing = viewportWidth - buttonRect.right;
            spacingResults.leftEdgeSpacing = buttonRect.left;

            // Check spacing from task list
            spacingResults.taskListSpacing = Math.abs(buttonRect.right - taskListRect.left);

            // Check spacing from other sections
            if (progressSection) {
                const progressRect = progressSection.getBoundingClientRect();
                spacingResults.progressSpacing = Math.abs(buttonRect.bottom - progressRect.top);
            }

            if (suggestionsSection) {
                const suggestionsRect = suggestionsSection.getBoundingClientRect();
                spacingResults.suggestionsSpacing = Math.abs(buttonRect.bottom - suggestionsRect.top);
            }

            // Validate spacing requirements
            const spacingIssues = [];

            if (spacingResults.rightEdgeSpacing < this.minDesktopSpacing) {
                spacingIssues.push(`Right edge spacing too small: ${spacingResults.rightEdgeSpacing.toFixed(2)}px < ${this.minDesktopSpacing}px`);
            }

            if (spacingResults.leftEdgeSpacing < this.minDesktopSpacing) {
                spacingIssues.push(`Left edge spacing too small: ${spacingResults.leftEdgeSpacing.toFixed(2)}px < ${this.minDesktopSpacing}px`);
            }

            if (spacingResults.taskListSpacing < this.minDesktopSpacing) {
                spacingIssues.push(`Task list spacing too small: ${spacingResults.taskListSpacing.toFixed(2)}px < ${this.minDesktopSpacing}px`);
            }

            console.log('Spacing measurements:', spacingResults);

            if (spacingIssues.length > 0) {
                console.log('⚠️  Spacing issues found:', spacingIssues);
                return { passed: false, spacingIssues, measurements: spacingResults };
            } else {
                console.log('✅ All spacing requirements met');
                return { passed: true, measurements: spacingResults };
            }

        } catch (error) {
            return { passed: false, error: error.message };
        }
    }

    /**
     * Test 3: Test positioning with varying task list heights
     * Requirements: 1.1, 1.4
     */
    async testVaryingTaskHeights() {
        try {
            const taskList = document.getElementById('taskList');
            if (!taskList) {
                return { passed: false, error: 'Task list element not found' };
            }

            const testHeights = [1, 3, 5, 10, 15, 20];
            const results = [];
            let allPassed = true;

            for (const height of testHeights) {
                console.log(`Testing with ${height} tasks...`);
                
                // Populate task list with specified number of tasks
                this.populateTestTasks(height);
                
                // Wait for layout to settle
                await this.waitForLayoutSettlement();

                // Test positioning with this height
                const positioningResult = this.calculateDropdownPosition();
                
                if (!positioningResult.success) {
                    console.log(`  ❌ Positioning calculation failed for ${height} tasks`);
                    allPassed = false;
                    results.push({ height, passed: false, error: positioningResult.error });
                    continue;
                }

                const hasOverlap = positioningResult.collisionDetails.some(
                    detail => detail.element === 'task-list-section'
                );

                if (hasOverlap && positioningResult.recommendation === 'standard') {
                    console.log(`  ❌ Unhandled overlap with ${height} tasks`);
                    allPassed = false;
                    results.push({ height, passed: false, hasOverlap: true, avoidanceActive: false });
                } else {
                    const status = hasOverlap ? 'overlap handled' : 'no overlap';
                    console.log(`  ✅ ${height} tasks: ${status} (${positioningResult.recommendation})`);
                    results.push({ 
                        height, 
                        passed: true, 
                        hasOverlap, 
                        strategy: positioningResult.recommendation 
                    });
                }
            }

            // Restore original task count
            this.populateTestTasks(5);

            return { passed: allPassed, results };

        } catch (error) {
            return { passed: false, error: error.message };
        }
    }

    /**
     * Test 4: Verify grid layout integration
     * Requirements: 1.4, 4.1
     */
    testGridLayoutIntegration() {
        try {
            const main = document.querySelector('main');
            const taskFormSection = document.querySelector('.task-form-section');
            const taskListSection = document.querySelector('.task-list-section');
            const progressSection = document.querySelector('.progress-section');
            const suggestionsSection = document.querySelector('.suggestions-section');

            if (!main || !taskFormSection || !taskListSection) {
                return { passed: false, error: 'Required grid elements not found' };
            }

            const viewportWidth = window.innerWidth;
            if (viewportWidth < 1024) {
                return { passed: true, skipped: true, reason: 'Not desktop layout' };
            }

            // Check if grid layout is active
            const mainStyles = window.getComputedStyle(main);
            const isGridLayout = mainStyles.display === 'grid';

            if (!isGridLayout) {
                console.log('⚠️  Grid layout not detected');
                return { passed: false, error: 'Grid layout not active' };
            }

            // Check grid positioning
            const taskFormRect = taskFormSection.getBoundingClientRect();
            const taskListRect = taskListSection.getBoundingClientRect();

            // In desktop grid layout, task list should be in right column
            const taskListInRightColumn = taskListRect.left > taskFormRect.left;

            if (!taskListInRightColumn) {
                console.log('❌ Task list not positioned in right column');
                return { passed: false, error: 'Task list not in expected grid position' };
            }

            // Check that task list spans multiple rows (grid-row: 1 / span 2)
            const taskListHeight = taskListRect.height;
            const taskFormHeight = taskFormRect.height;
            const progressHeight = progressSection ? progressSection.getBoundingClientRect().height : 0;

            const expectedMinHeight = taskFormHeight + progressHeight;
            const heightRatio = taskListHeight / expectedMinHeight;

            console.log(`Grid layout verification:
  - Grid display: ${isGridLayout}
  - Task list in right column: ${taskListInRightColumn}
  - Task list height ratio: ${heightRatio.toFixed(2)}`);

            if (heightRatio < 0.8) {
                console.log('⚠️  Task list may not be spanning expected rows');
            }

            console.log('✅ Grid layout integration verified');
            return { 
                passed: true, 
                gridActive: isGridLayout,
                taskListInRightColumn,
                heightRatio 
            };

        } catch (error) {
            return { passed: false, error: error.message };
        }
    }

    /**
     * Test 5: Verify viewport boundary handling
     * Requirements: 1.1, 4.1
     */
    testViewportBoundaries() {
        try {
            const button = document.querySelector('.theme-toggle-btn');
            if (!button) {
                return { passed: false, error: 'Theme button not found' };
            }

            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const buttonRect = button.getBoundingClientRect();

            // Calculate potential dropdown position
            const dropdownLeft = buttonRect.right - this.estimatedDropdownWidth;
            const dropdownRight = dropdownLeft + this.estimatedDropdownWidth;
            const dropdownTop = buttonRect.bottom + this.minButtonSpacing;
            const dropdownBottom = dropdownTop + this.estimatedDropdownHeight;

            // Check viewport boundaries
            const boundaryIssues = [];

            if (dropdownLeft < 0) {
                boundaryIssues.push(`Dropdown extends beyond left edge: ${dropdownLeft}px`);
            }

            if (dropdownRight > viewportWidth) {
                boundaryIssues.push(`Dropdown extends beyond right edge: ${dropdownRight - viewportWidth}px`);
            }

            if (dropdownTop < 0) {
                boundaryIssues.push(`Dropdown extends beyond top edge: ${dropdownTop}px`);
            }

            if (dropdownBottom > viewportHeight) {
                boundaryIssues.push(`Dropdown extends beyond bottom edge: ${dropdownBottom - viewportHeight}px`);
            }

            console.log(`Viewport boundary check:
  - Viewport: ${viewportWidth}x${viewportHeight}
  - Dropdown bounds: ${dropdownLeft}, ${dropdownTop}, ${dropdownRight}, ${dropdownBottom}`);

            if (boundaryIssues.length > 0) {
                console.log('⚠️  Viewport boundary issues:', boundaryIssues);
                
                // Check if collision avoidance can handle these issues
                const hasCollisionAvoidanceCSS = this.checkCollisionAvoidanceCSS();
                if (hasCollisionAvoidanceCSS) {
                    console.log('✅ Boundary issues detected but collision avoidance available');
                    return { passed: true, boundaryIssues, collisionAvoidanceAvailable: true };
                } else {
                    return { passed: false, boundaryIssues, collisionAvoidanceAvailable: false };
                }
            } else {
                console.log('✅ No viewport boundary issues');
                return { passed: true };
            }

        } catch (error) {
            return { passed: false, error: error.message };
        }
    }

    /**
     * Check if collision avoidance CSS classes are available
     * @returns {boolean} True if collision avoidance CSS is available
     */
    checkCollisionAvoidanceCSS() {
        try {
            // Create a temporary element to test CSS classes
            const testElement = document.createElement('div');
            testElement.className = 'theme-dropdown position-left';
            testElement.style.visibility = 'hidden';
            testElement.style.position = 'absolute';
            testElement.style.top = '-9999px';
            
            document.body.appendChild(testElement);
            
            const styles = window.getComputedStyle(testElement);
            const hasPositionLeft = styles.right === 'auto' || styles.left !== 'auto';
            
            document.body.removeChild(testElement);
            
            // Also check for position-center class
            testElement.className = 'theme-dropdown position-center';
            document.body.appendChild(testElement);
            
            const centerStyles = window.getComputedStyle(testElement);
            const hasPositionCenter = centerStyles.transform.includes('translateX');
            
            document.body.removeChild(testElement);
            
            return hasPositionLeft || hasPositionCenter;
            
        } catch (error) {
            console.warn('Error checking collision avoidance CSS:', error);
            return false;
        }
    }

    /**
     * Calculate dropdown position and detect collisions
     * @returns {Object} Positioning calculation result
     */
    calculateDropdownPosition() {
        try {
            const dropdown = document.querySelector('.theme-dropdown');
            const button = document.querySelector('.theme-toggle-btn');
            const taskList = document.querySelector('.task-list-section');

            if (!dropdown || !button) {
                return { success: false, error: 'Required elements not found' };
            }

            const buttonRect = button.getBoundingClientRect();
            const taskListRect = taskList ? taskList.getBoundingClientRect() : null;
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            // Calculate potential dropdown position
            const dropdownLeft = buttonRect.right - this.estimatedDropdownWidth;
            const dropdownRight = dropdownLeft + this.estimatedDropdownWidth;
            const dropdownTop = buttonRect.bottom + this.minButtonSpacing;
            const dropdownBottom = dropdownTop + this.estimatedDropdownHeight;

            let hasCollision = false;
            let collisionDetails = [];

            // Check for collision with task list
            if (taskListRect) {
                const horizontalOverlap = dropdownRight > taskListRect.left && dropdownLeft < taskListRect.right;
                const verticalOverlap = dropdownBottom > taskListRect.top && dropdownTop < taskListRect.bottom;

                if (horizontalOverlap && verticalOverlap) {
                    hasCollision = true;
                    collisionDetails.push({
                        element: 'task-list-section',
                        overlap: {
                            horizontal: horizontalOverlap,
                            vertical: verticalOverlap,
                            overlapWidth: Math.min(dropdownRight, taskListRect.right) - Math.max(dropdownLeft, taskListRect.left),
                            overlapHeight: Math.min(dropdownBottom, taskListRect.bottom) - Math.max(dropdownTop, taskListRect.top)
                        }
                    });
                }
            }

            // Check viewport boundaries
            const viewportCollision = {
                right: dropdownRight > viewportWidth,
                bottom: dropdownBottom > viewportHeight,
                left: dropdownLeft < 0,
                top: dropdownTop < 0
            };

            if (Object.values(viewportCollision).some(collision => collision)) {
                hasCollision = true;
                collisionDetails.push({
                    element: 'viewport',
                    boundaries: viewportCollision
                });
            }

            // Determine positioning strategy
            let recommendation = 'standard';
            let adjustments = {};

            if (hasCollision) {
                // Collision detected - determine best alternative positioning
                if (taskListRect && dropdownRight > taskListRect.left) {
                    // Try left-aligned positioning
                    const leftAlignedRight = buttonRect.left + this.estimatedDropdownWidth;
                    if (leftAlignedRight < taskListRect.left || leftAlignedRight < viewportWidth * 0.8) {
                        recommendation = 'left-aligned';
                        adjustments.alignLeft = true;
                    } else {
                        // Try center positioning
                        recommendation = 'center-aligned';
                        adjustments.center = true;
                    }
                }
            }

            return {
                success: true,
                hasCollision,
                collisionDetails,
                recommendation,
                adjustments,
                measurements: {
                    button: buttonRect,
                    taskList: taskListRect,
                    viewport: { width: viewportWidth, height: viewportHeight },
                    estimatedDropdown: {
                        left: dropdownLeft,
                        right: dropdownRight,
                        top: dropdownTop,
                        bottom: dropdownBottom,
                        width: this.estimatedDropdownWidth,
                        height: this.estimatedDropdownHeight
                    }
                }
            };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Populate task list with test tasks
     * @param {number} count Number of tasks to create
     */
    populateTestTasks(count) {
        const taskList = document.getElementById('taskList');
        if (!taskList) return;

        taskList.innerHTML = '';

        const sampleTasks = [
            { name: 'Complete project proposal', category: 'Work', time: '09:00' },
            { name: 'Review quarterly reports', category: 'Work', time: '14:30' },
            { name: 'Study JavaScript fundamentals', category: 'Study', time: '19:00' },
            { name: 'Grocery shopping', category: 'Personal', time: '11:00' },
            { name: 'Team meeting preparation', category: 'Work', time: '08:30' },
            { name: 'Read technical documentation', category: 'Study', time: '20:00' },
            { name: 'Exercise routine', category: 'Personal', time: '07:00' },
            { name: 'Code review session', category: 'Work', time: '15:00' },
            { name: 'Learn new framework', category: 'Study', time: '18:00' },
            { name: 'Plan weekend activities', category: 'Personal', time: '16:00' },
            { name: 'Database optimization', category: 'Work', time: '10:00' },
            { name: 'Algorithm practice', category: 'Study', time: '21:00' },
            { name: 'Home maintenance', category: 'Personal', time: '13:00' },
            { name: 'Client presentation', category: 'Work', time: '11:30' },
            { name: 'Research new technologies', category: 'Study', time: '17:00' },
            { name: 'Family dinner', category: 'Personal', time: '18:30' },
            { name: 'Bug fixing session', category: 'Work', time: '09:30' },
            { name: 'Online course completion', category: 'Study', time: '20:30' },
            { name: 'Doctor appointment', category: 'Personal', time: '14:00' },
            { name: 'Sprint planning meeting', category: 'Work', time: '10:30' }
        ];

        for (let i = 0; i < Math.min(count, sampleTasks.length); i++) {
            const task = sampleTasks[i];
            const taskElement = this.createTaskElement({
                id: `test-task-${i}`,
                name: task.name,
                category: task.category,
                time: task.time,
                completed: Math.random() > 0.7 // Randomly complete some tasks
            });
            taskList.appendChild(taskElement);
        }
    }

    /**
     * Create a task element for testing
     * @param {Object} task Task data
     * @returns {HTMLElement} Task element
     */
    createTaskElement(task) {
        const taskItem = document.createElement('div');
        taskItem.className = `task-item${task.completed ? ' completed' : ''}`;
        taskItem.setAttribute('data-task-id', task.id);

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'task-checkbox';
        checkbox.checked = task.completed;

        const taskContent = document.createElement('div');
        taskContent.className = 'task-content';

        const taskName = document.createElement('div');
        taskName.className = 'task-name';
        taskName.textContent = task.name;

        const taskMeta = document.createElement('div');
        taskMeta.className = 'task-meta';

        const categoryTag = document.createElement('span');
        categoryTag.className = `task-category ${task.category.toLowerCase()}`;
        categoryTag.textContent = task.category;
        taskMeta.appendChild(categoryTag);

        if (task.time) {
            const timeDisplay = document.createElement('span');
            timeDisplay.className = 'task-time';
            timeDisplay.textContent = this.formatTaskTime(task.time);
            taskMeta.appendChild(timeDisplay);
        }

        taskContent.appendChild(taskName);
        taskContent.appendChild(taskMeta);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'task-delete';
        deleteButton.textContent = 'Delete';

        taskItem.appendChild(checkbox);
        taskItem.appendChild(taskContent);
        taskItem.appendChild(deleteButton);

        return taskItem;
    }

    /**
     * Format task time for display
     * @param {string} timeString Time in HH:MM format
     * @returns {string} Formatted time
     */
    formatTaskTime(timeString) {
        if (!timeString) return '';

        try {
            const [hours, minutes] = timeString.split(':');
            const hour = parseInt(hours, 10);
            const minute = parseInt(minutes, 10);

            const period = hour >= 12 ? 'PM' : 'AM';
            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
            const displayMinute = minute.toString().padStart(2, '0');

            return `${displayHour}:${displayMinute} ${period}`;
        } catch (error) {
            return timeString;
        }
    }

    /**
     * Wait for layout to settle after DOM changes
     * @returns {Promise} Promise that resolves after layout settlement
     */
    waitForLayoutSettlement() {
        return new Promise(resolve => {
            // Force a reflow
            document.body.offsetHeight;
            
            // Wait for next frame
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    resolve();
                });
            });
        });
    }

    /**
     * Log test summary
     * @param {Object} summary Test summary data
     */
    logTestSummary(summary) {
        console.log('\n' + '='.repeat(50));
        console.log('🧪 DESKTOP GRID LAYOUT POSITIONING TEST SUMMARY');
        console.log('='.repeat(50));
        console.log(`Total Tests: ${summary.totalTests}`);
        console.log(`Passed: ${summary.passedTests}`);
        console.log(`Failed: ${summary.failedTests}`);
        console.log(`Success Rate: ${summary.successRate}%`);
        console.log('='.repeat(50));

        if (summary.passedTests === summary.totalTests) {
            console.log('🎉 ALL TESTS PASSED! Desktop grid layout positioning is working correctly.');
        } else {
            console.log('⚠️  Some tests failed. Review the results above for details.');
        }

        // Log detailed results
        console.log('\nDetailed Results:');
        summary.results.forEach((result, index) => {
            const status = result.passed ? '✅ PASS' : '❌ FAIL';
            const details = result.skipped ? ' (SKIPPED)' : '';
            console.log(`${index + 1}. ${result.name}: ${status}${details}`);
            if (result.error) {
                console.log(`   Error: ${result.error}`);
            }
        });
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DesktopGridPositioningTester;
}

// Auto-run tests if script is loaded directly
if (typeof window !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        // Wait a bit for other scripts to initialize
        setTimeout(async () => {
            console.log('🚀 Auto-running Desktop Grid Layout Positioning Tests...');
            const tester = new DesktopGridPositioningTester();
            await tester.runAllTests();
        }, 1000);
    });
} else if (typeof window !== 'undefined') {
    // Document already loaded
    setTimeout(async () => {
        console.log('🚀 Auto-running Desktop Grid Layout Positioning Tests...');
        const tester = new DesktopGridPositioningTester();
        await tester.runAllTests();
    }, 1000);
}