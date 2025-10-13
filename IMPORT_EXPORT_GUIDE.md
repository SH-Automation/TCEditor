# Import/Export Guide

## Overview

The Import/Export feature enables bulk data management through CSV and JSON files, making it easy to migrate data, create backups, or integrate with external systems. The column mapping interface ensures data integrity by requiring explicit 1:1 field mappings.

## Key Features

### 🔼 Import Capabilities
- **CSV File Upload**: Upload spreadsheet data in standard CSV format
- **Intelligent Column Mapping**: Visual interface for mapping CSV columns to database fields
- **Auto-Detection**: Automatic mapping suggestions based on column names
- **Validation**: Pre-import validation ensures all required fields are mapped
- **Error Reporting**: Detailed feedback on failed imports with specific error messages
- **Preview**: See sample data before committing the import

### 🔽 Export Capabilities
- **Multiple Formats**: Export as CSV (for spreadsheets) or JSON (for APIs)
- **Single or Multi-Table**: Export one table or all tables at once
- **Data Preservation**: Maintains data integrity for round-trip operations
- **Template Generation**: Download pre-formatted CSV templates

## Getting Started

### Accessing Import/Export
1. Navigate to the **Import/Export** tab in the main navigation
2. Choose between the **Import** or **Export** tabs

## Import Workflow

### Step 1: Download Template (Recommended)
Before importing, download a CSV template to understand the required structure:

1. Click on the table card you want to import (Catalog Steps, Test Cases, or Step Memberships)
2. Click **"Download Template"**
3. Open the template in your spreadsheet application
4. Fill in your data following the template structure

### Step 2: Prepare Your Data

#### Catalog Steps Template
```csv
id,name,description,javaClass,javaMethod,sqlTables
step-001,Login Test,Verifies user login,com.example.LoginTest,testUserLogin,"users, sessions"
step-002,Data Validation,Validates form data,com.example.DataTest,testValidation,"forms, validation_rules"
```

**Field Requirements:**
- `id`: Unique identifier (required)
- `name`: Display name (required)
- `description`: Detailed description (required)
- `javaClass`: Full Java class path (required)
- `javaMethod`: Method name (required)
- `sqlTables`: Comma-separated table names (optional)

#### Test Cases Template
```csv
id,name,description
test-001,User Authentication Flow,Tests complete login/logout cycle
test-002,Data Entry Validation,Validates all form inputs
```

**Field Requirements:**
- `id`: Unique identifier (required)
- `name`: Test case name (required)
- `description`: Test case description (required)

#### Step Memberships Template
```csv
id,testCaseId,catalogStepId,processOrder
mem-001,test-001,step-001,1
mem-002,test-001,step-002,2
```

**Field Requirements:**
- `id`: Unique identifier (required)
- `testCaseId`: Reference to existing test case (required)
- `catalogStepId`: Reference to existing catalog step (required)
- `processOrder`: Execution order number (required)

### Step 3: Upload and Map

1. Click **"Import CSV"** on the appropriate table card
2. Select your CSV file
3. Review the preview showing total rows and sample data
4. Map each CSV column to a database field:
   - **Source Column**: Your CSV column name (left side)
   - **Target Field**: Database field (right side)
   - **Auto-mapped**: The system will suggest mappings based on column names
   - **Required fields**: Marked with a red "Required" badge

#### Column Mapping Interface

```
CSV Column              →    Database Field
────────────────────────────────────────────
id                      →    ID [Required]
Sample: step-001

name                    →    Name [Required]  
Sample: Login Test

description             →    Description [Required]
Sample: Verifies login

javaClass               →    Java Class [Required]
Sample: com.example.Test
```

### Step 4: Validate and Import

1. Ensure all required fields are mapped (indicated by green checkmark)
2. Review any validation errors (shown in red warning box)
3. Click **"Import X Records"** to proceed
4. View success message with count of imported records

### Common Import Issues

| Issue | Solution |
|-------|----------|
| "Required field not mapped" | Ensure all fields marked "Required" have a corresponding CSV column |
| "Field mapped more than once" | Each database field can only be mapped to one CSV column |
| "Failed to parse CSV" | Ensure file is valid CSV format with consistent delimiters |
| "Duplicate ID" | IDs must be unique across all records |
| "Invalid data type" | Check that numeric fields contain numbers, not text |

## Export Workflow

### Quick Export (Single Table)

1. Go to the **Export** tab
2. Click **"Export to CSV"** on any table card
3. File downloads immediately with all current data

Each table exports with these fields:

**Catalog Steps**: `id, name, description, javaClass, javaMethod, sqlTables`  
**Test Cases**: `id, name, description`  
**Step Memberships**: `id, testCaseId, catalogStepId, processOrder`

### Advanced Export (Multi-Table or JSON)

1. Click **"Advanced Export Options"**
2. Select which tables to include (check boxes)
3. Choose export format:
   - **CSV**: Spreadsheet-compatible, one file per table
   - **JSON**: API-compatible, single file with all data
4. Click **"Export Data"**

#### JSON Export Format

When exporting multiple tables as JSON:

```json
{
  "catalog-steps": [
    {
      "id": "step-001",
      "name": "Login Test",
      "description": "Verifies user login",
      "javaClass": "com.example.LoginTest",
      "javaMethod": "testUserLogin",
      "sqlTables": "users, sessions"
    }
  ],
  "test-cases": [
    {
      "id": "test-001",
      "name": "User Authentication Flow",
      "description": "Tests complete login/logout cycle"
    }
  ],
  "test-memberships": [
    {
      "id": "mem-001",
      "testCaseId": "test-001",
      "catalogStepId": "step-001",
      "processOrder": 1
    }
  ]
}
```

## Best Practices

### For Imports
- ✅ Always download and use templates first
- ✅ Test with a small file (5-10 rows) before bulk import
- ✅ Keep IDs simple and consistent (e.g., step-001, step-002)
- ✅ Validate your CSV in a spreadsheet application before uploading
- ✅ Use consistent date/time formats if applicable
- ❌ Don't use special characters in IDs (stick to alphanumeric and hyphens)
- ❌ Don't leave required fields empty
- ❌ Don't duplicate IDs across different imports

### For Exports
- ✅ Export regularly as backups
- ✅ Use CSV for spreadsheet analysis
- ✅ Use JSON for API integration or programmatic access
- ✅ Export before major system changes
- ✅ Keep exported files organized with timestamps in filenames

### Round-Trip Workflow
To backup and restore data:

1. **Export all tables** as CSV or JSON
2. Make changes in the system
3. **Import the exported files** to restore previous state
4. Ensure IDs match exactly for proper restoration

## Tips & Tricks

### Excel/Google Sheets Integration

**Opening CSVs:**
- Excel: File → Open → Select CSV → Use Text Import Wizard
- Google Sheets: File → Import → Upload file → Import data

**Saving CSVs:**
- Excel: File → Save As → CSV UTF-8 (Comma delimited)
- Google Sheets: File → Download → Comma-separated values (.csv)

### Bulk Data Generation

Use spreadsheet formulas to generate test data:

```excel
=CONCATENATE("step-", TEXT(ROW()-1, "000"))    // Generates: step-001, step-002, etc.
=CONCATENATE("Test Step ", ROW()-1)            // Generates: Test Step 1, Test Step 2, etc.
```

### Mapping Multiple Tables

When importing step memberships, ensure:
1. Catalog steps are imported first
2. Test cases are imported second  
3. Step memberships are imported last

This ensures all references exist before creating relationships.

## Troubleshooting

### Import Failed: Parse Error
**Cause**: CSV file is malformed or uses wrong delimiter  
**Solution**: 
- Ensure commas are used as delimiters
- Check that quoted fields are properly escaped
- Save file as "CSV UTF-8" format

### Import Failed: Validation Error
**Cause**: Missing required fields or incorrect data types  
**Solution**:
- Review the validation error message
- Check that all required fields have values
- Verify numeric fields contain only numbers

### Export Shows 0 Records
**Cause**: Selected table has no data  
**Solution**: Add data to the table before exporting, or select a different table

### Column Mapping Not Matching
**Cause**: CSV column names don't match database field names  
**Solution**: Manually map each column in the mapping interface, or rename CSV columns to match field names exactly

## Technical Details

### Supported File Formats
- **Import**: CSV (UTF-8 encoded, comma-delimited)
- **Export**: CSV or JSON

### File Size Limits
- Recommended: < 1000 rows for optimal performance
- Files with 100+ rows show progress indicator
- Very large files may need to be split into chunks

### Data Type Handling
- **Text**: Imported as-is
- **Numbers**: Validated as numeric (processOrder field)
- **Arrays**: SQL tables are comma-separated and split automatically
- **IDs**: Must be unique strings

### Character Encoding
- UTF-8 encoding is recommended
- Special characters (accents, symbols) are supported
- CSV files should be saved with UTF-8 encoding

## Security Considerations

- Imported data is validated before insertion
- SQL injection protection through data sanitization
- File parsing happens client-side (no server upload)
- Exported files contain current user's accessible data only

## Support

For additional help:
1. Check the **Quick Start Guide** in the Overview tab
2. Review sample data in CSV templates
3. Test with small files before bulk operations
4. Verify data in the system after import
