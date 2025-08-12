# Contributing to PowerBackup

Thanks for thinking about contributing to **PowerBackup**! We want this process to be friendly, transparent, and welcoming—whether you’re fixing a typo, improving docs, or adding big new features.

---

## 🔋💾 Quick Start

1. **Fork** the repository
2. **Clone** your fork:

   ```bash
   git clone https://github.com/your-username/powerbackup.git
   ```
3. **Install** dependencies:

   ```bash
   npm install
   ```
4. **Create** a branch:

   ```bash
   git checkout -b feature/amazing-feature
   ```
5. **Make** your changes
6. **Test** your changes:

   ```bash
   npm run test:all
   ```
7. **Commit** your changes:

   ```bash
   git commit -m 'feat: add amazing feature'
   ```
8. **Push** your branch:

   ```bash
   git push origin feature/amazing-feature
   ```
9. **Open** a Pull Request

---

## 📋 Development Setup

### Prerequisites

* Node.js 18+
* Git
* MySQL and/or PostgreSQL (for testing)

### Installation

```bash
git clone https://github.com/your-username/powerbackup.git
cd powerbackup
npm install
```

### Development Commands

```bash
npm run test:all          # Run all tests
npm run test:unit         # Unit tests
npm run test:integration  # Integration tests
npm run dev               # Hot-reload development mode
npm run lint              # Lint code (if ESLint is configured)
npm run build             # Build project (if needed)
```

---

## 🎯 Code Style Guidelines

### JavaScript/Node.js

* Use **ES Modules** (`import` / `export`)
* Prefer **async/await** over callbacks
* Use `const` / `let` (avoid `var`)
* **camelCase** for variables and functions
* **PascalCase** for classes
* **UPPER\_SNAKE\_CASE** for constants

### File Naming

* **kebab-case** for general files: `backup-manager.js`
* **PascalCase** for class files: `BackupManager.js`
* **camelCase** for utilities: `fileUtils.js`

### Documentation

* JSDoc for functions and classes
* Include examples
* Keep **README.md** updated
* Log breaking changes in **CHANGELOG.md**

### Logging

* Use the built-in logging system (`log.info`, `log.success`, etc.)
* Emojis encouraged
* Provide context for errors

---

## 🧪 Testing Guidelines

### Structure

```javascript
describe('Feature Name', () => {
  it('should do something specific', () => {
    const input = 'test';
    const result = functionToTest(input);
    expect(result).toBe('expected');
  });
});
```

### Goals

* 90%+ coverage
* Test happy paths, errors, and edge cases
* Use clear, descriptive test names

### Commands

```bash
npm run test:all
npm run test:unit
npm run test:integration
npm run test:coverage
```

---

## 🔧 Git Workflow

### Branch Names

* `feature/feature-name`
* `fix/bug-description`
* `docs/update-docs`
* `refactor/improve-code`
* `test/add-tests`

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git commit -m 'feat(backup): add incremental backup'
git commit -m 'fix(mysql): resolve connection timeout'
```

---

## 🐛 Bug Reports

### Before Submitting

1. Search existing issues
2. Test on the latest version
3. Confirm you can reproduce consistently

### Template

```markdown
## Bug Description
Brief description

## Steps to Reproduce
1. Step 1
2. Step 2

## Expected Behavior
...

## Actual Behavior
...

## Environment
- OS: ...
- Node.js: ...
- PowerBackup: ...
- Database: ...

## Additional Info
Logs, screenshots, etc.
```

---

## 💡 Feature Requests

Before requesting:

* Search existing issues
* Consider project scope
* Think about implementation complexity

### Template

```markdown
## Feature Description
Brief description

## Use Case
Why this is needed

## Proposed Solution
...

## Alternatives
...
```

---

## 🔒 Security Issues

Please do **not** open public issues.

1. Email the maintainers
2. Provide full details
3. Wait for a coordinated response

---

## 📚 Documentation

* Clear and concise
* Code examples where relevant
* Step-by-step guides
* Screenshots when useful
* Keep links and references up to date

---

## 🏷️ Release Process

### Versioning

* **Major**: Breaking changes
* **Minor**: New features
* **Patch**: Bug fixes

### Checklist

* [ ] Tests pass
* [ ] Docs updated
* [ ] CHANGELOG.md updated
* [ ] Version bumped
* [ ] Tagged and pushed

---

## 🤝 Code of Conduct

* Be respectful, constructive, and inclusive
* Avoid harassment, trolling, spam, or privacy violations

---

## 📞 Getting Help

* GitHub Issues: bugs & features
* GitHub Discussions: Q\&A
* Documentation: check README & DEPLOYMENT first

---

## 🎉 Recognition

We love our contributors! You’ll be recognized in:

* **README.md**
* **CHANGELOG.md**
* **GitHub contributors graph**
