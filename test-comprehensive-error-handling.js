// Comprehensive Error Handling Test Suite for Task Dashboard MVP
// This script tests all error handling scenarios for storage operations

console.log('Starting comprehensive error handling tests...');

// Test 1: Storage Availability Detection
function testStorageAvailability() {
    console.log('\n=== Test 1: Storage Availability ===');
    
    // Test normal availability
    const available = isStorageAvailable();
    console.log(`Storage available: ${available}`);
    
    // Test with localStorage disabled (simulation)
    const originalLocalStorage = window.localStorage;
    
    // Simulate localStorage being undefined
    Object.defineProperty(window, 'localStorage', {
        value: undefined,
        writable: true
    });
    
    const unavailable = isStorageAvailable();
    console.log(`Storage available (when undefined): ${unavailable}`);
    
    // Restore localStorage
    Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        writable: true
    });
    
    console.log('✓ Storage availability test completed');
}

// Test 2: Data Validation
function testDataValidation() {
    console.log('\n=== Test 2: Data Validation ===');
    
    const testCases = [
        {
            name: 'Valid tasks',
            data: [
                { id: '1', name: 'Test Task', category: 'Work', completed: false, time: '09:00' },
                { id: '2', name: 'Another Task', category: 'Personal', completed: true, time: '' }
            ],
            expectedValid: 2
        },
        {
            name: 'Mixed valid/invalid tasks',
            data: [
                { id: '1', name: 'Valid Task', category: 'Work', completed: false, time: '09:00' },
                { id: '', name: 'Invalid ID', category: 'Work', completed: false, time: '' },
                { id: '3', name: '', category: 'Work', completed: false, time: '' },
                { id: '4', name: 'Invalid Category', category: 'Invalid', completed: false, time: '' },
                { id: '5', name: 'Invalid Time', category: 'Work', completed: false, time: '25:99' }
            ],
            expectedValid: 1
        },
        {
            name: 'Non-array data',
            data: { not: 'an array' },
            expectedValid: 0
        },
        {
            name: 'Null data',
            data: null,
            expectedValid: 0
        }
    ];
    
    testCases.forEach(testCase => {
        console.log(`\nTesting: ${testCase.name}`);
        
        // Save test data
        try {
            localStorage.setItem('taskDashboardTasks', JSON.stringify(testCase.data));
        } catch (error) {
            localStorage.setItem('taskDashboardTasks', 'invalid json');
        }
        
        // Load and validate
        const loaded = loadTasksFromStorage();
        const validCount = Array.isArray(loaded) ? loaded.length : 0;
        
        console.log(`Expected valid: ${testCase.expectedValid}, Got: ${validCount}`);
        console.log(validCount === testCase.expectedValid ? '✓ PASS' : '✗ FAIL');
    });
    
    console.log('✓ Data validation test completed');
}

// Test 3: JSON Parsing Errors
function testJSONParsingErrors() {
    console.log('\n=== Test 3: JSON Parsing Errors ===');
    
    const malformedData = [
        '{"incomplete": json',
        'not json at all',
        '{"valid": "json", "but": "wrong structure"}',
        '',
        'undefined',
        'null'
    ];
    
    malformedData.forEach((data, index) => {
        console.log(`\nTesting malformed data ${index + 1}: "${data}"`);
        
        localStorage.setItem('taskDashboardTasks', data);
        const loaded = loadTasksFromStorage();
        
        const isValidResult = Array.isArray(loaded) && loaded.length === 0;
        console.log(`Result: ${isValidResult ? 'PASS' : 'FAIL'} - Got: ${JSON.stringify(loaded)}`);
    });
    
    console.log('✓ JSON parsing error test completed');
}

// Test 4: Storage Quota Simulation
function testStorageQuotaHandling() {
    console.log('\n=== Test 4: Storage Quota Handling ===');
    
    // Create large data to test size warnings
    const largeTasks = [];
    for (let i = 0; i < 1000; i++) {
        largeTasks.push({
            id: `large-${i}`,
            name: `Large task ${i} with lots of text to make it bigger and test the size warning functionality`,
            category: 'Work',
            completed: i % 2 === 0,
            time: '09:00'
        });
    }
    
    console.log(`Created ${largeTasks.length} tasks for size test`);
    console.log(`Data size: ${JSON.stringify(largeTasks).length} bytes`);
    
    const saveResult = saveTasksToStorage(largeTasks);
    console.log(`Save result: ${saveResult ? 'SUCCESS' : 'FAILED'}`);
    
    // Test fallback behavior (incomplete tasks only)
    const incompleteTasks = largeTasks.filter(task => !task.completed);
    console.log(`Incomplete tasks for fallback: ${incompleteTasks.length}`);
    
    console.log('✓ Storage quota handling test completed');
}

// Test 5: Warning System
function testWarningSystem() {
    console.log('\n=== Test 5: Warning System ===');
    
    // Test different warning types
    console.log('Testing regular warning...');
    showStorageWarning('Test regular warning');
    
    setTimeout(() => {
        console.log('Testing persistent warning...');
        showStorageWarning('Test persistent warning', true);
    }, 1000);
    
    setTimeout(() => {
        console.log('Testing multiple warnings...');
        showStorageWarning('First warning');
        showStorageWarning('Second warning');
        showStorageWarning('Third warning');
    }, 2000);
    
    console.log('✓ Warning system test completed');
}

// Test 6: Task Operation Error Recovery
function testTaskOperationRecovery() {
    console.log('\n=== Test 6: Task Operation Error Recovery ===');
    
    // Clear existing tasks
    tasks = [];
    
    // Test adding task with storage failure simulation
    console.log('Testing task addition with storage issues...');
    
    // Temporarily break localStorage
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function() {
        throw new Error('Simulated storage failure');
    };
    
    // Try to add a task
    document.getElementById('taskName').value = 'Test Task';
    document.getElementById('taskCategory').value = 'Work';
    
    try {
        addTask();
        console.log('Task addition handled storage failure gracefully');
    } catch (error) {
        console.log('Task addition failed:', error.message);
    }
    
    // Restore localStorage
    localStorage.setItem = originalSetItem;
    
    console.log('✓ Task operation recovery test completed');
}

// Test 7: Storage Recovery
function testStorageRecovery() {
    console.log('\n=== Test 7: Storage Recovery ===');
    
    const recoveryResult = attemptStorageRecovery();
    console.log(`Storage recovery result: ${recoveryResult ? 'SUCCESS' : 'FAILED'}`);
    
    const storageInfo = getStorageInfo();
    console.log('Storage info:', storageInfo);
    
    console.log('✓ Storage recovery test completed');
}

// Run all tests
function runAllTests() {
    console.log('🧪 Starting comprehensive error handling test suite...\n');
    
    try {
        testStorageAvailability();
        testDataValidation();
        testJSONParsingErrors();
        testStorageQuotaHandling();
        testWarningSystem();
        testTaskOperationRecovery();
        testStorageRecovery();
        
        console.log('\n🎉 All error handling tests completed!');
        console.log('Check the browser console and UI for warning messages.');
        
    } catch (error) {
        console.error('Test suite failed:', error);
    }
}

// Auto-run tests when script loads
if (typeof window !== 'undefined' && window.document) {
    // Wait for DOM and app to be ready
    setTimeout(runAllTests, 1000);
} else {
    // Node.js environment
    runAllTests();
}