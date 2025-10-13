# Test Case Management System

A comprehensive application for managing software test cases with reusable test steps from a centralized catalog, enabling structured test execution with proper sequencing and data entry capabilities.

**Experience Qualities**:
1. **Professional** - Clean, enterprise-grade interface that instills confidence in testing workflows
2. **Efficient** - Streamlined step selection and ordering with minimal clicks and clear visual feedback
3. **Organized** - Clear hierarchical structure showing catalog → test cases → ordered steps relationships

**Complexity Level**: Light Application (multiple features with basic state)
- Manages multiple interconnected entities (catalog, test cases, step memberships) with ordering logic and data persistence

## Essential Features

### Database Connection Management
- **Functionality**: Configure and manage Microsoft SQL Server database connections with full connection string parameters
- **Purpose**: Enable persistent storage of test case data in enterprise SQL Server databases with proper security
- **Trigger**: User navigates to Database tab or clicks "New Connection"
- **Progression**: Enter connection details (server, port, database, credentials) → Configure security options (encryption, certificate trust) → Set timeout parameters → Save and activate connection
- **Success criteria**: Connection configurations are saved securely, users can switch between multiple database connections, and active connection status is clearly displayed

### SQL Schema Management
- **Functionality**: View complete SQL Server table schemas with columns, data types, primary keys, foreign keys, and indexes
- **Purpose**: Document and communicate exact database structure needed for production deployment
- **Trigger**: User clicks "View Schema" in Database tab
- **Progression**: View schema definitions → Copy SQL CREATE statements → Reference table structures for integration
- **Success criteria**: Complete SQL DDL statements are available for CatalogSteps, TestCases, and TestStepMemberships tables with all constraints

### Query Executor with Prepared Statements
- **Functionality**: Execute parameterized SQL queries with automatic SQL injection prevention through prepared statements
- **Purpose**: Enable safe database operations for read, write, update, and delete operations
- **Trigger**: User navigates to Query tab or loads sample query
- **Progression**: Write or select query → Define parameters using @paramName syntax → Execute with parameter binding → View results and execution time
- **Success criteria**: All queries use prepared statements, parameters are properly sanitized, and execution results show success/error status with timing

### Catalog Management
- **Functionality**: Centralized repository of reusable test steps with metadata, Java class/method references, and SQL table associations
- **Purpose**: Provides standardized, reusable building blocks for test case construction backed by database persistence
- **Trigger**: User navigates to Catalog tab or clicks "Manage Catalog" 
- **Progression**: View catalog list → Add/edit step → Define metadata (name, description, Java class/method) → Specify SQL tables → Save to database
- **Success criteria**: Steps are saved with complete metadata via INSERT/UPDATE prepared statements and can be searched/filtered effectively

### Test Case Creation
- **Functionality**: Create named test cases and associate them with ordered sequences of catalog steps with full CRUD operations
- **Purpose**: Enables building complex test scenarios from reusable components with explicit execution order stored in SQL Server
- **Trigger**: User clicks "New Test Case" or navigates to Test Cases tab
- **Progression**: Create test case → Name and describe → Browse catalog → Select steps → Define execution order → Save via database transaction
- **Success criteria**: Test cases contain properly ordered step sequences persisted to database with foreign key relationships maintained

### Step Ordering & Membership Management
- **Functionality**: Define explicit ProcessOrder values for TestCase-TestStep relationships with transactional updates
- **Purpose**: Ensures test steps execute in correct sequence with reliable database-backed ordering
- **Trigger**: User selects steps for a test case or clicks reorder controls
- **Progression**: Select test case → View current step sequence → Drag to reorder or use up/down controls → System updates ProcessOrder via bulk UPDATE transaction → Confirm changes
- **Success criteria**: Steps display in correct order, ProcessOrder values are automatically maintained via database constraints, and unique constraints prevent conflicts

### Data Entry Configuration
- **Functionality**: Display and manage SQL table associations for each test step to guide data preparation
- **Purpose**: Provides clear guidance on what test data is required for each step with schema references
- **Trigger**: User views step details or prepares test execution
- **Progression**: Select step → View associated SQL tables → Display table schemas/requirements → Reference column definitions and types
- **Success criteria**: Users understand data requirements and can prepare appropriate test datasets with proper SQL Server data types

### Dynamic Data Entry Grid
- **Functionality**: Automatically generate editable data grids based on SQL Server table schema introspection using INFORMATION_SCHEMA.COLUMNS
- **Purpose**: Enable users to manage test data directly in the application with automatic schema-driven UI generation
- **Trigger**: User navigates to Data Entry tab and selects a catalog step
- **Progression**: Select catalog step → System queries INFORMATION_SCHEMA for table schema → Generate grid with columns matching DB schema → Add/edit/delete rows → Validate against column constraints → Save via prepared statements
- **Success criteria**: Grid automatically updates when catalog changes, columns display correct data types, validation enforces nullable/required constraints, and all operations use prepared statements for security

## Edge Case Handling
- **Empty Catalog**: Display helpful onboarding message with "Create First Step" action
- **Duplicate Step Selection**: Prevent adding same step twice to a test case with clear feedback
- **Orphaned Steps**: Handle catalog step deletion when referenced in existing test cases with warning dialogs and foreign key constraint checks
- **Invalid Order Values**: Automatically recalculate ProcessOrder sequences when gaps or conflicts occur, enforced by unique constraints in database
- **Large Catalogs**: Implement search/filtering to handle hundreds of catalog steps efficiently with indexed queries
- **Connection Failures**: Gracefully handle database connection errors with clear error messages and retry options
- **SQL Injection Attempts**: All queries use prepared statements with parameterized inputs to prevent injection attacks
- **Concurrent Updates**: Handle simultaneous database modifications with proper transaction isolation
- **Parameter Validation**: Sanitize all user inputs before binding to query parameters
- **Timeout Handling**: Respect connection and request timeout settings with appropriate user feedback
- **Schema Changes**: Cache table schemas with 5-minute TTL and provide manual refresh to detect schema updates
- **Invalid Data Types**: Validate user input against column data types (int, varchar, datetime, etc.) before submission
- **Required Fields**: Enforce NOT NULL constraints with clear visual indicators and validation messages
- **Primary Key Conflicts**: Prevent manual editing of auto-generated identity columns
- **Foreign Key Violations**: Display referenced table information and validate FK relationships before insert/update
- **Large Result Sets**: Limit data grid queries to 100 rows by default with pagination support
- **No Database Connection**: Show friendly message with link to database settings when not connected
- **Tables Without Primary Keys**: Handle gracefully with warning that edit/delete may be limited

## Design Direction
The design should feel professional and systematic like enterprise testing tools, emphasizing clarity and efficiency over visual flourish, with a clean interface that reduces cognitive load during complex test planning workflows.

## Color Selection
Complementary (opposite colors) - Using a professional blue-green palette that communicates reliability and precision, with warm accent colors for actions and important status indicators.

- **Primary Color**: Deep Professional Blue (oklch(0.45 0.15 240)) - Communicates trust, reliability, and technical competence
- **Secondary Colors**: Soft Blue-Gray (oklch(0.85 0.03 240)) for backgrounds and Muted Blue (oklch(0.65 0.08 240)) for secondary actions
- **Accent Color**: Warm Orange (oklch(0.7 0.15 50)) - Attention-grabbing highlight for CTAs, active states, and process indicators
- **Foreground/Background Pairings**: 
  - Background (Light Gray oklch(0.98 0.005 240)): Dark Blue text (oklch(0.2 0.1 240)) - Ratio 12.5:1 ✓
  - Card (White oklch(1 0 0)): Dark Blue text (oklch(0.2 0.1 240)) - Ratio 15.8:1 ✓
  - Primary (Deep Blue oklch(0.45 0.15 240)): White text (oklch(1 0 0)) - Ratio 4.9:1 ✓
  - Secondary (Blue-Gray oklch(0.85 0.03 240)): Dark Blue text (oklch(0.2 0.1 240)) - Ratio 7.2:1 ✓
  - Accent (Warm Orange oklch(0.7 0.15 50)): White text (oklch(1 0 0)) - Ratio 4.8:1 ✓

## Font Selection
Clean, technical typography using Inter for its excellent readability in data-heavy interfaces and professional appearance that supports extended reading sessions.

- **Typographic Hierarchy**: 
  - H1 (Page Titles): Inter Bold/32px/tight letter spacing
  - H2 (Section Headers): Inter Semibold/24px/normal spacing  
  - H3 (Card Titles): Inter Semibold/18px/normal spacing
  - Body (Content): Inter Regular/16px/relaxed line height
  - Caption (Metadata): Inter Medium/14px/tight line height
  - Code (Java Classes): JetBrains Mono Regular/14px/monospace spacing

## Animations
Subtle, purposeful animations that support workflow understanding - step reordering should feel fluid and responsive, while state changes provide gentle confirmation without disrupting concentration on complex test planning tasks.

- **Purposeful Meaning**: Smooth drag-and-drop animations reinforce the concept of step ordering, while subtle hover states on catalog items suggest interactivity
- **Hierarchy of Movement**: Step reordering gets prominent animation feedback, catalog browsing has subtle hover responses, and save operations show gentle confirmation states

## Component Selection
- **Components**: 
  - Card components for catalog steps and test cases with clear visual hierarchy
  - Tabs for navigation between Catalog/Test Cases/Execution views
  - Dialog for step creation/editing with form validation
  - Drag-and-drop enabled lists using react-beautiful-dnd patterns
  - Badge components for Java class names and SQL table indicators
  - Button variants (primary for save/create, secondary for cancel/back, ghost for reorder controls)
- **Customizations**: 
  - Custom drag handles with grip dots for step reordering
  - Enhanced card layouts showing step metadata, Java references, and table associations
  - Progressive disclosure patterns for detailed step information
- **States**: 
  - Buttons: Clear disabled states during saves, hover feedback for all interactive elements
  - Cards: Selected, hover, and dragging states with appropriate visual feedback
  - Forms: Inline validation with constructive error messaging and success confirmation
- **Icon Selection**: 
  - List/catalog icon for catalog management
  - TestTube or CheckSquare for test cases
  - ArrowUp/ArrowDown for step reordering
  - Plus for adding new items
  - Trash for deletions with confirmation
- **Spacing**: Consistent 4/6/8/12/16px spacing scale, with generous padding in cards and comfortable gaps in lists
- **Mobile**: 
  - Stack sidebar navigation into collapsible drawer
  - Convert drag-and-drop to up/down button controls on touch devices
  - Ensure form inputs are appropriately sized for mobile interaction
  - Maintain readable text sizes and touch-friendly button targets