# Task Dashboard MVP

A simple, accessible, and responsive task management application built with vanilla HTML, CSS, and JavaScript. 

## 🚀 Features

- **Task Management**: Add, complete, and delete tasks with ease
- **Categories**: Organize tasks by Work, Study, or Personal categories
- **Time Scheduling**: Optional time scheduling for tasks
- **Progress Tracking**: Visual progress bar showing completion percentage
- **Productivity Tips**: Built-in suggestion system for productivity advice
- **Real-time Clock**: Live clock display with date and time
- **Responsive Design**: Works seamlessly on mobile, tablet, and desktop
- **Accessibility**: Full screen reader support and keyboard navigation
- **Cross-browser Compatible**: Tested on Chrome, Firefox, Safari, and Edge

## 📱 Screenshots

### Desktop View

The application features a clean, modern interface with a two-column layout on desktop devices. 

![screenshot - Desktop View](screenshots/desktop%20view%201.png)

![screenshot - Desktop View](screenshots/desktop%20view%202.png)

![screenshot - Desktop View](screenshots/desktop%20view%203.png)

### Mobile View

On mobile devices, the interface adapts to a single-column layout with touch-friendly controls.

![screenshot - Desktop View](screenshots/mobile%20view%201.png)

![screenshot - Desktop View](screenshots/mobile%20view%202.png)

![screenshot - Desktop View](screenshots/mobile%20view%203.png)

## 🛠️ Installation

1. **Clone or Download**: Get the project files
2. **No Build Process**: This is a vanilla JavaScript application - no compilation needed
3. **Open in Browser**: Simply open `index.html` in any modern web browser

```bash
# If using a local server (recommended for development)
# Python 3
python -m http.server 8000

# Node.js

Write-Host "Starting local server for Task Dashboard MVP..." -ForegroundColor Green; Write-Host "Server will be available at: http://localhost:3000" -ForegroundColor Yellow; Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Cyan; npx serve . -p 3000

```

# Live Server

  Open VSCODE or any IDE then right click the index.html


# Then open http://localhost:8000
```

## 📖 Usage

### Adding Tasks

1. Enter a task name in the "Task Name" field
2. Select a category (Work, Study, or Personal)
3. Optionally set a scheduled time
4. Click "Add Task" or press Enter

### Managing Tasks

- **Complete Task**: Click the checkbox next to any task
- **Delete Task**: Click the red "Delete" button
- **View Progress**: Check the progress bar to see completion percentage

### Keyboard Shortcuts

- **Ctrl+Enter**: Add task from anywhere on the page
- **Enter**: Add task when focused on task name field
- **Alt+S**: Get a productivity suggestion
- **Tab**: Navigate through interactive elements
- **Space/Enter**: Activate buttons and checkboxes

### Productivity Tips

Click the "Ask Kiro for a Suggestion" button to receive helpful productivity tips and advice.

## 🏗️ Architecture

### File Structure

```
task-dashboard-mvp/
├── index.html          # Main HTML structure
├── styles.css          # CSS styling and responsive design
├── script.js           # JavaScript functionality
└── README.md           # This documentation
```

### Technology Stack

- **HTML5**: Semantic markup with accessibility features
- **CSS3**: Modern styling with Flexbox and Grid layouts
- **Vanilla JavaScript**: No frameworks or dependencies
- **Progressive Enhancement**: Works without JavaScript (basic functionality)

### Key Components

#### 1. Task Management System

- Task creation, completion, and deletion
- Local data storage (in-memory)
- Form validation and error handling

#### 2. User Interface

- Responsive design with mobile-first approach
- Accessible form controls and navigation
- Real-time updates and visual feedback

#### 3. Progress Tracking

- Automatic calculation of completion percentage
- Visual progress bar with smooth animations
- Screen reader announcements for progress changes

#### 4. Productivity Features

- Random productivity tip generator
- Time-based task scheduling
- Category-based organization

## ♿ Accessibility Features

### Screen Reader Support

- Comprehensive ARIA labels and descriptions
- Live regions for dynamic content updates
- Proper heading hierarchy and semantic markup
- Screen reader announcements for user actions

### Keyboard Navigation

- Full keyboard accessibility
- Logical tab order
- Visible focus indicators
- Keyboard shortcuts for common actions

### Visual Accessibility

- High contrast color scheme
- WCAG AA compliant color ratios
- Scalable fonts and responsive design
- Support for reduced motion preferences

## 📱 Browser Support

### Fully Supported

- **Chrome** 80+ (Desktop & Mobile)
- **Firefox** 75+ (Desktop & Mobile)
- **Safari** 13+ (Desktop & Mobile)
- **Edge** 80+ (Desktop & Mobile)

### Graceful Degradation

- Older browsers receive basic functionality
- Progressive enhancement ensures core features work everywhere
- Fallbacks for modern CSS and JavaScript features

## 🎨 Customization

### Styling

The application uses CSS custom properties for easy theming:

```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --success-color: #38a169;
  --error-color: #e53e3e;
  --background-color: #f5f7fa;
}
```

### Categories

To add new task categories, modify the `categories` array in `script.js`:

```javascript
const categories = ["Work", "Study", "Personal", "Health", "Finance"];
```

### Productivity Tips

Add new suggestions to the `suggestions` array in `script.js`:

```javascript
const suggestions = [
  "Your custom productivity tip here",
  // ... existing tips
];
```

## 🔧 Development

### Code Structure

The JavaScript code is organized into logical sections:

1. **Application State**: Global variables and data structures
2. **Utility Functions**: Helper functions for common operations
3. **UI Components**: Functions for rendering and updating the interface
4. **Event Handlers**: User interaction and form processing
5. **Initialization**: Application startup and setup

### Performance Optimizations

- Batch DOM updates using DocumentFragment
- Debounced user interactions
- Efficient task rendering algorithms
- Memory leak prevention

### Error Handling

- Comprehensive try-catch blocks
- User-friendly error messages
- Graceful degradation for missing features
- Console logging for debugging

## 🧪 Testing

### Manual Testing Checklist

- [ ] Add tasks with different categories
- [ ] Complete and uncomplete tasks
- [ ] Delete tasks
- [ ] Test form validation
- [ ] Check responsive design on different screen sizes
- [ ] Verify keyboard navigation
- [ ] Test with screen reader
- [ ] Check cross-browser compatibility

### Accessibility Testing

- Use screen readers (NVDA, JAWS, VoiceOver)
- Navigate using only keyboard
- Test with high contrast mode
- Verify color contrast ratios
- Check with reduced motion settings

## 🚀 Deployment

### Static Hosting

This application can be deployed to any static hosting service:

- **GitHub Pages**: Push to a repository and enable Pages
- **Netlify**: Drag and drop the files or connect to Git
- **Vercel**: Deploy with zero configuration
- **Firebase Hosting**: Use Firebase CLI to deploy

### CDN Deployment

For better performance, consider using a CDN:

```html
<!-- Example: Using a CDN for faster loading -->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="dns-prefetch" href="//fonts.googleapis.com" />
```

## 🤝 Contributing

### Code Style

- Use semantic HTML elements
- Follow BEM methodology for CSS classes
- Write self-documenting JavaScript
- Include accessibility attributes
- Test across multiple browsers

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request with detailed description

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with accessibility in mind following WCAG guidelines
- Inspired by modern task management applications
- Uses semantic HTML and progressive enhancement principles
- Designed for cross-browser compatibility and performance

## 📞 Support

For questions, issues, or suggestions:

1. Check the existing documentation
2. Search for similar issues
3. Create a new issue with detailed information
4. Include browser version and steps to reproduce

---

**Task Dashboard MVP** - Simple, accessible, and effective task management for everyone.
