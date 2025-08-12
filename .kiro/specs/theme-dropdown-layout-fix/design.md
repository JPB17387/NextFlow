# Design Document

## Overview

The theme dropdown layout fix addresses a critical positioning issue where the dropdown menu overlaps with the "Your Tasks" section in desktop layouts. The solution involves adjusting the CSS positioning strategy, improving z-index management, and implementing responsive positioning logic that adapts to different screen sizes and layout contexts.

## Architecture

### Current Issue Analysis

The current implementation uses absolute positioning with `right: 0` and `top: calc(100% + 0.5rem)` which works well in most cases but fails in the desktop grid layout where:

1. The header spans the full width
2. The theme selector is positioned on the right side of the header
3. The task list section is positioned in the right column of the main grid
4. The dropdown appears directly below the theme button, overlapping with the task list

### Solution Architecture

The fix implements a multi-layered approach:

1. **Enhanced Positioning Logic**: Implement smart positioning that detects potential overlaps
2. **Improved Z-Index Management**: Ensure proper stacking context
3. **Responsive Positioning**: Adapt positioning strategy based on viewport and layout
4. **Collision Detection**: Prevent overlaps with other page elements

## Components and Interfaces

### 1. Enhanced CSS Positioning

**Current Implementation:**

```css
.theme-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  z-index: 1000;
}
```

**Enhanced Implementation:**

```css
.theme-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  z-index: 1050; /* Higher than other elements */
  max-width: calc(100vw - 2rem); /* Prevent overflow */
}

/* Desktop-specific positioning adjustments */
@media (min-width: 1024px) {
  .theme-dropdown {
    /* Adjust positioning to avoid task list overlap */
    right: 0;
    left: auto;
    transform: translateX(0);
  }

  /* Alternative positioning when overlap detected */
  .theme-dropdown.position-left {
    right: auto;
    left: 0;
  }

  .theme-dropdown.position-center {
    right: auto;
    left: 50%;
    transform: translateX(-50%);
  }
}
```

### 2. JavaScript Positioning Logic

**Purpose**: Dynamically adjust dropdown positioning to prevent overlaps

**Core Functions**:

- `calculateDropdownPosition()`: Determine optimal positioning
- `detectCollisions()`: Check for potential overlaps with other elements
- `adjustDropdownPosition()`: Apply positioning adjustments
- `handleViewportResize()`: Respond to window resize events

**Implementation Strategy**:

```javascript
function calculateDropdownPosition() {
  const dropdown = document.querySelector(".theme-dropdown");
  const button = document.querySelector(".theme-toggle-btn");
  const taskList = document.querySelector(".task-list-section");

  if (!dropdown || !button) return;

  const buttonRect = button.getBoundingClientRect();
  const taskListRect = taskList ? taskList.getBoundingClientRect() : null;
  const viewportWidth = window.innerWidth;

  // Check for potential overlap
  if (taskListRect && buttonRect.right > taskListRect.left) {
    // Apply collision avoidance positioning
    applyCollisionAvoidance(dropdown, buttonRect, taskListRect);
  }
}
```

### 3. Z-Index Management System

**Purpose**: Ensure proper stacking order for all UI elements

**Z-Index Hierarchy**:

```css
/* Base layer: 0-99 */
.task-item {
  z-index: 1;
}
.section {
  z-index: 2;
}

/* Interactive layer: 100-999 */
.form-elements {
  z-index: 100;
}
.buttons {
  z-index: 200;
}

/* Overlay layer: 1000-1999 */
.theme-dropdown {
  z-index: 1050;
}
.tooltips {
  z-index: 1100;
}

/* Modal layer: 2000+ */
.modals {
  z-index: 2000;
}
.alerts {
  z-index: 2100;
}
```

### 4. Responsive Positioning Strategy

**Mobile (< 768px)**:

- Dropdown positioned relative to button
- Full-width consideration for small screens
- Touch-friendly spacing

**Tablet (768px - 1023px)**:

- Standard absolute positioning
- Adequate spacing from edges
- Collision detection enabled

**Desktop (≥ 1024px)**:

- Enhanced collision detection
- Grid-aware positioning
- Dynamic adjustment based on content layout

## Data Models

### Positioning Configuration

```javascript
const positioningConfig = {
  mobile: {
    strategy: "standard",
    minSpacing: 16,
    maxWidth: "calc(100vw - 2rem)",
  },
  tablet: {
    strategy: "collision-aware",
    minSpacing: 24,
    maxWidth: "300px",
  },
  desktop: {
    strategy: "grid-aware",
    minSpacing: 32,
    maxWidth: "320px",
    collisionDetection: true,
  },
};
```

### Collision Detection Data

```javascript
const collisionData = {
  dropdown: {
    element: null,
    rect: null,
    preferredPosition: "bottom-right",
  },
  obstacles: [
    { element: ".task-list-section", priority: "high" },
    { element: ".suggestions-section", priority: "medium" },
    { element: ".progress-section", priority: "low" },
  ],
};
```

## Error Handling

### Positioning Failures

- **Calculation Errors**: Fallback to default positioning
- **Element Not Found**: Graceful degradation with console warnings
- **Viewport Issues**: Responsive fallback positioning

### Browser Compatibility

- **CSS Support Detection**: Feature detection for advanced positioning
- **JavaScript Fallbacks**: Progressive enhancement approach
- **Legacy Browser Support**: Basic positioning for older browsers

### Performance Considerations

- **Debounced Resize Handling**: Prevent excessive recalculations
- **Cached Measurements**: Store frequently used calculations
- **Efficient DOM Queries**: Minimize layout thrashing

## Testing Strategy

### Visual Regression Testing

1. **Screenshot Comparison**: Before/after positioning changes
2. **Cross-Browser Testing**: Ensure consistent behavior
3. **Device Testing**: Verify responsive positioning
4. **Theme Testing**: Confirm positioning works across all themes

### Functional Testing

1. **Collision Detection**: Verify overlap prevention
2. **Responsive Behavior**: Test across viewport sizes
3. **Keyboard Navigation**: Ensure accessibility maintained
4. **Performance Testing**: Measure positioning calculation speed

### Integration Testing

1. **Grid Layout Integration**: Test with existing desktop layout
2. **Theme System Integration**: Ensure compatibility with theme switching
3. **Dynamic Content Testing**: Test with varying task list lengths
4. **Multi-Screen Testing**: Verify behavior on different screen configurations

## Implementation Approach

### Phase 1: CSS Improvements

1. Update z-index values for proper stacking
2. Add responsive positioning rules
3. Implement collision-aware CSS classes
4. Add viewport-based positioning adjustments

### Phase 2: JavaScript Enhancements

1. Implement collision detection logic
2. Add dynamic positioning calculations
3. Create viewport resize handlers
4. Integrate with existing theme system

### Phase 3: Testing and Refinement

1. Cross-browser testing
2. Responsive behavior validation
3. Accessibility compliance verification
4. Performance optimization

## Visual Design Specifications

### Positioning Rules

**Standard Position (No Collision)**:

- Dropdown appears below theme button
- Right-aligned with button
- 8px spacing from button bottom

**Collision Avoidance Positions**:

- **Left-aligned**: When right side would overlap
- **Center-aligned**: When both sides would overlap
- **Offset positioning**: When standard positions fail

### Spacing Requirements

- **Minimum edge spacing**: 16px on mobile, 24px on tablet, 32px on desktop
- **Button spacing**: 8px minimum from theme button
- **Content spacing**: 16px minimum from other page elements
- **Viewport spacing**: Never extend beyond viewport edges

### Animation Considerations

- Maintain existing transition animations
- Ensure smooth positioning changes
- Prevent jarring repositioning during resize
- Preserve accessibility motion preferences

## Accessibility Compliance

### Focus Management

- Maintain focus within dropdown during positioning changes
- Ensure keyboard navigation works regardless of position
- Provide clear focus indicators in all positions

### Screen Reader Support

- Announce positioning changes when significant
- Maintain proper ARIA relationships
- Ensure dropdown content remains discoverable

### Motion Sensitivity

- Respect `prefers-reduced-motion` settings
- Minimize unnecessary positioning animations
- Provide instant positioning for motion-sensitive users

## Integration Points

### Existing Theme System

- Maintain compatibility with current theme switching
- Preserve theme-aware styling
- Ensure positioning works across all themes

### Grid Layout System

- Integrate with existing desktop grid layout
- Respect grid boundaries and spacing
- Maintain responsive design principles

### Header Component

- Preserve header layout and styling
- Maintain theme button functionality
- Ensure header responsiveness not affected
