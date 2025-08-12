# Contributing to PowerBackup

Thank you for your interest in contributing to PowerBackup! This document provides guidelines and information for contributors.

## 🚀 Quick Start

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/your-username/powerbackup.git`
3. **Install** dependencies: `./setup.sh`
4. **Create** a feature branch: `git checkout -b feature/amazing-feature`
5. **Make** your changes
6. **Test** your changes: `npm run test:all`
7. **Commit** your changes: `git commit -m 'feat: add amazing feature'`
8. **Push** to your branch: `git push origin feature/amazing-feature`
9. **Open** a Pull Request

## 📋 Development Setup

### Prerequisites
- Node.js 18+
- Git
- MySQL and/or PostgreSQL (for testing)

### Installation
```bash
# Clone the repository
git clone https://github.com/your-username/powerbackup.git
cd powerbackup

# Run setup script
chmod +x setup.sh
./setup.sh

# Install development dependencies
npm install
```

### Development Commands
```bash
# Run tests
npm run test:all
npm run test:unit
npm run test:integration

# Development mode with hot reload
npm run dev

# Lint code (if ESLint is configured)
npm run lint

# Build (if needed)
npm run build
```

## 🎯 Code Style Guidelines

### JavaScript/Node.js
- Use **ES Modules** (`import`/`export`)
- Prefer **async/await** over callbacks
- Use **const** and **let** (avoid **var**)
- Follow **camelCase** for variables and functions
- Use **PascalCase** for classes
- Use **UPPER_SNAKE_CASE** for constants

### File Naming
- Use **kebab-case** for file names: `backup-manager.js`
- Use **PascalCase** for class files: `BackupManager.js`
- Use **camelCase** for utility files: `fileUtils.js`

### Documentation
- Use **JSDoc** comments for functions and classes
- Include **examples** in documentation
- Keep **README.md** updated
- Document **breaking changes** in CHANGELOG.md

### Logging
- Use the **beautiful logging system** (`log.info`, `log.success`, etc.)
- Include **emojis** for visual appeal
- Use **descriptive messages**
- Log **errors** with context

## 🧪 Testing Guidelines

### Test Structure
```javascript
describe('Feature Name', () => {
    it('should do something specific', () => {
        // Arrange
        const input = 'test';
        
        // Act
        const result = functionToTest(input);
        
        // Assert
        expect(result).toBe('expected');
    });
});
```

### Test Coverage
- Aim for **90%+ test coverage**
- Test **happy path** scenarios
- Test **error conditions**
- Test **edge cases**
- Use **descriptive test names**

### Running Tests
```bash
# Run all tests
npm run test:all

# Run specific test suites
npm run test:unit
npm run test:integration

# Run tests with coverage (if configured)
npm run test:coverage
```

## 🔧 Git Workflow

### Branch Naming
- `feature/feature-name` - New features
- `fix/bug-description` - Bug fixes
- `docs/documentation-update` - Documentation changes
- `refactor/code-improvement` - Code refactoring
- `test/test-addition` - Test additions

### Commit Messages
Use **Conventional Commits** format:
```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Test additions or changes
- `chore` - Build process or auxiliary tool changes

**Examples:**
```bash
git commit -m 'feat(backup): add incremental backup support'
git commit -m 'fix(mysql): resolve connection timeout issues'
git commit -m 'docs(readme): update installation instructions'
```

### Pull Request Guidelines
1. **Title** should be descriptive and follow conventional commits
2. **Description** should explain what and why (not how)
3. **Include** tests for new features
4. **Update** documentation if needed
5. **Ensure** all tests pass
6. **Add** screenshots for UI changes

## 🐛 Bug Reports

### Before Submitting
1. **Search** existing issues
2. **Test** with the latest version
3. **Reproduce** the issue consistently

### Bug Report Template
```markdown
## Bug Description
Brief description of the issue

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- OS: [e.g., Windows 10, Ubuntu 20.04]
- Node.js Version: [e.g., 18.17.0]
- PowerBackup Version: [e.g., 2.0.0]
- Database: [e.g., MySQL 8.0, PostgreSQL 13]

## Additional Information
- Error messages
- Screenshots
- Log files
```

## 💡 Feature Requests

### Before Submitting
1. **Search** existing issues
2. **Consider** if it fits the project scope
3. **Think** about implementation complexity

### Feature Request Template
```markdown
## Feature Description
Brief description of the feature

## Use Case
Why is this feature needed?

## Proposed Solution
How should this feature work?

## Alternatives Considered
Other approaches you've considered

## Additional Information
- Mockups
- Examples
- Related issues
```

## 🔒 Security Issues

If you discover a security vulnerability, please **DO NOT** open a public issue. Instead:

1. **Email** the maintainers directly
2. **Include** detailed information about the vulnerability
3. **Wait** for a response before disclosing publicly

## 📚 Documentation

### Documentation Standards
- Use **clear, concise language**
- Include **code examples**
- Provide **step-by-step instructions**
- Use **screenshots** when helpful
- Keep **links updated**

### Documentation Structure
- **README.md** - Quick start and overview
- **DEPLOYMENT.md** - Deployment instructions
- **CHANGELOG.md** - Version history
- **CONTRIBUTING.md** - This file
- **API.md** - API documentation (if applicable)

## 🏷️ Release Process

### Version Bumping
- **Major** version for breaking changes
- **Minor** version for new features
- **Patch** version for bug fixes

### Release Checklist
- [ ] All tests pass
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] Release notes written
- [ ] Tagged and pushed

## 🤝 Code of Conduct

### Our Standards
- **Be respectful** and inclusive
- **Be collaborative** and helpful
- **Be constructive** in feedback
- **Be patient** with newcomers

### Unacceptable Behavior
- **Harassment** or discrimination
- **Trolling** or insulting comments
- **Spam** or off-topic posts
- **Violation** of privacy

## 📞 Getting Help

### Questions and Support
- **GitHub Issues** - For bugs and feature requests
- **GitHub Discussions** - For questions and support
- **Documentation** - Check README.md and DEPLOYMENT.md first

### Community Guidelines
- **Be patient** - Maintainers are volunteers
- **Be specific** - Provide detailed information
- **Be respectful** - Follow the code of conduct
- **Be helpful** - Help others when you can

## 🎉 Recognition

Contributors will be recognized in:
- **README.md** - Contributors section
- **CHANGELOG.md** - Release notes
- **GitHub** - Contributors graph

Thank you for contributing to PowerBackup! 🚀
