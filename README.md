# Test Case Management System

A comprehensive web application for managing software test cases with reusable test steps from a centralized catalog, enabling structured test execution with proper sequencing and data entry capabilities.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19.0-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue.svg)
![Tests](https://img.shields.io/badge/tests-passing-brightgreen.svg)

## 🎯 Overview

The Test Case Management System is a professional, enterprise-grade application designed for QA teams and software testers to efficiently manage test cases, organize reusable test steps, and maintain structured test execution workflows. Built with modern web technologies, it provides a clean, intuitive interface backed by robust data persistence and comprehensive validation.

### Key Features

- **📋 Catalog Management**: Create and maintain a centralized library of reusable test steps with metadata, Java class/method references, and SQL table associations
- **🧪 Test Case Creation**: Build complex test scenarios by combining catalog steps with explicit execution ordering
- **🗄️ Database Integration**: Full Microsoft SQL Server support with connection management, schema viewing, and safe parameterized queries
- **📊 Dynamic Data Entry**: Auto-generated data grids based on SQL table schema introspection using INFORMATION_SCHEMA
- **⏮️ Undo/Redo System**: Comprehensive change tracking with visual timeline, keyboard shortcuts, and full bidirectional history navigation
- **📥 Import/Export**: Bulk data operations via CSV with intelligent column mapping and validation
- **✅ Smart Validation**: Real-time input validation with contextual error messages and one-click auto-fix suggestions
- **🎨 Professional UI**: Clean, modern interface built with shadcn/ui components and Tailwind CSS

## 📦 Installation

### Prerequisites

- **Node.js**: Version 18.0 or higher
- **npm**: Version 9.0 or higher
- **Git**: For cloning the repository
- **Modern Browser**: Chrome, Firefox, Safari, or Edge (latest versions)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/test-case-management.git
   cd test-case-management
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   ```
   Navigate to http://localhost:5173
   ```

### Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## 🚀 Usage

### Getting Started

1. **Configure Database Connection** (Optional)
   - Navigate to the **Database** tab
   - Click "New Connection"
   - Enter SQL Server connection details
   - Test and save the connection

2. **Build Your Catalog**
   - Go to the **Catalog** tab
   - Click "Add Catalog Step"
   - Fill in step details:
     - Name (unique, 3-100 characters)
     - Description (10-500 characters)
     - Java Class (e.g., `com.example.TestClass`)
     - Java Method (e.g., `executeTest`)
     - Associated SQL Tables (comma-separated)
   - Save the step

3. **Create Test Cases**
   - Navigate to the **Test Cases** tab
   - Click "New Test Case"
   - Enter test case details:
     - TCID (e.g., `TC-001`, `PROJECT-TC-001-V1`)
     - Name and description
   - Select steps from your catalog
   - Define execution order by dragging steps or using up/down controls
   - Save the test case

4. **Manage Data Entry**
   - Go to the **Data Entry** tab
   - Select a catalog step
   - View auto-generated data grids based on SQL table schemas
   - Add, edit, or delete test data directly
   - All changes are validated against database constraints

5. **Import/Export Data**
   - Navigate to the **Import/Export** tab
   - **Export**: Select tables and download as CSV or JSON
   - **Import**: Upload CSV, map columns to database fields, validate, and import
   - Download CSV templates with sample data

6. **Track Changes**
   - Click the floating **History** button or navigate to the **History** tab
   - View visual timeline of all changes
   - Use **Ctrl+Z** to undo or **Ctrl+Y** to redo
   - Click any history entry to jump to that state
   - View analytics charts showing change patterns

7. **Execute Queries** (Advanced)
   - Go to the **Query** tab
   - Write parameterized SQL queries using `@paramName` syntax
   - Define parameters with proper types
   - Execute safely with prepared statements
   - View results and execution time

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Z` | Undo last action |
| `Ctrl+Y` | Redo last undone action |
| `Ctrl+S` | Save current form (when focused) |
| `Esc` | Close open dialog |

### Validation Rules

The system enforces comprehensive validation:

- **TCID Format**: Must match patterns like `TC-###`, `PROJECT-TC-###`, or `TC-###-VERSION`
- **Step Names**: 3-100 characters, must be unique
- **Java Classes**: PascalCase, valid package names (e.g., `com.example.MyClass`)
- **Java Methods**: camelCase, lowercase first letter (e.g., `myMethod`)
- **SQL Tables**: Valid identifiers, supports `schema.table` format
- **Process Order**: Unique integers for each test case, automatically suggested

## 🧪 Testing

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Test Coverage

The project maintains comprehensive test coverage:

- **Validators**: 100% coverage
- **Repositories**: 95%+ coverage
- **Services**: 90%+ coverage
- **Utilities**: 90%+ coverage

For detailed testing documentation, see [TESTING.md](./TESTING.md).

## 📚 Documentation

Comprehensive documentation is available in the following files:

- **[PRD.md](./PRD.md)**: Product Requirements Document with feature specifications
- **[TESTING.md](./TESTING.md)**: Complete testing guide with examples and best practices
- **[ARCHITECTURE.md](./ARCHITECTURE.md)**: System architecture and design patterns
- **[API_REFERENCE.md](./API_REFERENCE.md)**: API documentation for repositories and services
- **[DATABASE_IMPLEMENTATION.md](./DATABASE_IMPLEMENTATION.md)**: Database schema and implementation details
- **[HISTORY_README.md](./HISTORY_README.md)**: Undo/redo system documentation
- **[IMPORT_EXPORT_GUIDE.md](./IMPORT_EXPORT_GUIDE.md)**: Import/export functionality guide
- **[DATA_ENTRY_GUIDE.md](./DATA_ENTRY_GUIDE.md)**: Data entry features and usage
- **[DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)**: Guide for developers extending the system
- **[SECURITY.md](./SECURITY.md)**: Security best practices and guidelines

## 🏗️ Project Structure

```
test-case-management/
├── src/
│   ├── components/          # React components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── CatalogManager.tsx
│   │   ├── TestCaseManager.tsx
│   │   ├── DatabaseManager.tsx
│   │   ├── DataEntryManager.tsx
│   │   ├── ImportExportManager.tsx
│   │   └── ...
│   ├── models/             # TypeScript interfaces and types
│   ├── repositories/       # Data access layer
│   ├── validators/         # Input validation logic
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utility functions and services
│   ├── styles/             # CSS and theme files
│   ├── __tests__/          # Test files
│   ├── App.tsx             # Main application component
│   └── index.css           # Global styles and theme
├── public/                 # Static assets
├── index.html              # HTML entry point
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite configuration
├── vitest.config.ts        # Vitest configuration
└── tailwind.config.js      # Tailwind CSS configuration
```

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### Getting Started

1. **Fork the repository**
   ```bash
   git clone https://github.com/your-username/test-case-management.git
   cd test-case-management
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Follow the existing code style
   - Write tests for new functionality
   - Update documentation as needed

4. **Run tests and linting**
   ```bash
   npm test
   npm run lint
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Open a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your feature branch
   - Describe your changes clearly

### Contribution Guidelines

#### Code Style

- **TypeScript**: Use strict typing, avoid `any` when possible
- **React**: Use functional components with hooks
- **Naming**: Use camelCase for variables/functions, PascalCase for components
- **Comments**: Write code that explains itself; add comments only for complex logic
- **Formatting**: Code is automatically formatted with Prettier on commit

#### Component Guidelines

- **Shadcn Components**: Use existing shadcn/ui components from `@/components/ui`
- **New Components**: Place in `@/components/` with clear, descriptive names
- **Props**: Define TypeScript interfaces for all component props
- **Hooks**: Extract reusable logic into custom hooks in `@/hooks/`

#### Testing Requirements

- **New Features**: Must include tests (minimum 80% coverage)
- **Bug Fixes**: Add regression tests to prevent recurrence
- **Test Structure**: Use Arrange-Act-Assert pattern
- **Test Names**: Descriptive, behavior-focused names

Example:
```typescript
describe('CatalogValidator', () => {
  it('should accept valid step name with correct length', () => {
    // Arrange
    const stepName = 'Valid Test Step';
    
    // Act
    const result = validateStepName(stepName, []);
    
    // Assert
    expect(result.isValid).toBe(true);
  });
});
```

#### Commit Message Format

Follow conventional commits:

```
type(scope): brief description

Detailed description if needed

Closes #issue-number
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(catalog): add bulk import for catalog steps
fix(validation): correct TCID pattern matching
docs(readme): update installation instructions
test(history): add tests for undo/redo functionality
```

### What to Contribute

#### Good First Issues

- Documentation improvements
- UI/UX enhancements
- Additional validation rules
- More comprehensive error messages
- Additional test coverage
- Accessibility improvements

#### Feature Requests

- File an issue first to discuss the feature
- Wait for approval before starting work
- Keep features focused and incremental
- Update documentation with new features

#### Bug Reports

When reporting bugs, include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Browser and version information
- Screenshots or error messages if applicable

### Code Review Process

1. All submissions require code review
2. Maintainers will review within 1-2 business days
3. Address review feedback promptly
4. CI tests must pass before merging
5. Documentation must be updated for features

### Community

- **Questions**: Open a discussion on GitHub
- **Security Issues**: See [SECURITY.md](./SECURITY.md)
- **Feature Ideas**: Open an issue with the "enhancement" label

## 🛠️ Tech Stack

### Core Technologies

- **React 19.0**: UI framework
- **TypeScript 5.7**: Type-safe JavaScript
- **Vite 6.3**: Build tool and dev server
- **Tailwind CSS 4.1**: Utility-first CSS framework

### UI Libraries

- **shadcn/ui v4**: Component library
- **Radix UI**: Accessible component primitives
- **Phosphor Icons**: Icon set
- **Framer Motion**: Animation library

### Data & State

- **Spark KV**: Persistent key-value storage
- **React Hooks**: State management
- **Zod**: Schema validation

### Development Tools

- **Vitest**: Testing framework
- **Testing Library**: React component testing
- **ESLint**: Code linting
- **TypeScript**: Type checking

### Utilities

- **PapaParse**: CSV parsing
- **date-fns**: Date manipulation
- **class-variance-authority**: Component variants
- **clsx**: Conditional classNames

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

### Third-Party Licenses

- React: MIT License
- shadcn/ui: MIT License
- Tailwind CSS: MIT License
- Radix UI: MIT License

## 🙏 Acknowledgments

- **shadcn** for the excellent UI component library
- **Vercel** for Tailwind CSS and inspiration
- **Radix UI** team for accessible components
- **React** and **TypeScript** communities
- All contributors who have helped improve this project

## 📞 Support

### Getting Help

- **Documentation**: Check the docs in this repository
- **Issues**: Open an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions

### FAQ

**Q: Can I use this without a database connection?**  
A: Yes! The app uses browser-based storage by default. Database features are optional.

**Q: What browsers are supported?**  
A: All modern browsers (Chrome, Firefox, Safari, Edge) with ES2020+ support.

**Q: How do I reset all data?**  
A: Use the browser developer tools to clear localStorage, or use the "Clear All" option in the Overview tab.

**Q: Can I export my data?**  
A: Yes! Use the Import/Export tab to download all data as CSV or JSON.

**Q: Is my data secure?**  
A: All SQL queries use prepared statements to prevent SQL injection. See [SECURITY.md](./SECURITY.md) for details.

**Q: How do I contribute?**  
A: See the Contributing section above for guidelines.

## 🗺️ Roadmap

### Current Version (1.0)
- ✅ Core catalog and test case management
- ✅ Database integration
- ✅ Import/export functionality
- ✅ Undo/redo system
- ✅ Comprehensive testing

### Planned Features (1.1)
- [ ] Bulk edit operations
- [ ] Advanced search and filtering
- [ ] Test case templates
- [ ] Custom field definitions
- [ ] API integrations

### Future Considerations (2.0)
- [ ] Team collaboration features
- [ ] Role-based access control
- [ ] Reporting and analytics dashboard
- [ ] Integration with CI/CD pipelines
- [ ] Mobile app version

---

**Built with ❤️ by the Test Case Management Team**
