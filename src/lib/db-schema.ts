import { TableSchema } from './db-types';

export const SQL_SERVER_SCHEMA: Record<string, TableSchema> = {
  CatalogSteps: {
    tableName: 'CatalogSteps',
    columns: [
      {
        name: 'Id',
        type: 'UNIQUEIDENTIFIER',
        nullable: false,
        isPrimaryKey: true,
        isForeignKey: false,
      },
      {
        name: 'Name',
        type: 'NVARCHAR(255)',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
      },
      {
        name: 'Description',
        type: 'NVARCHAR(MAX)',
        nullable: true,
        isPrimaryKey: false,
        isForeignKey: false,
      },
      {
        name: 'JavaClass',
        type: 'NVARCHAR(500)',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
      },
      {
        name: 'JavaMethod',
        type: 'NVARCHAR(255)',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
      },
      {
        name: 'SqlTables',
        type: 'NVARCHAR(MAX)',
        nullable: true,
        isPrimaryKey: false,
        isForeignKey: false,
      },
      {
        name: 'CreatedAt',
        type: 'DATETIME2',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
      },
      {
        name: 'UpdatedAt',
        type: 'DATETIME2',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
      },
    ],
  },
  TestCases: {
    tableName: 'TestCases',
    columns: [
      {
        name: 'Id',
        type: 'UNIQUEIDENTIFIER',
        nullable: false,
        isPrimaryKey: true,
        isForeignKey: false,
      },
      {
        name: 'Name',
        type: 'NVARCHAR(255)',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
      },
      {
        name: 'Description',
        type: 'NVARCHAR(MAX)',
        nullable: true,
        isPrimaryKey: false,
        isForeignKey: false,
      },
      {
        name: 'CreatedAt',
        type: 'DATETIME2',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
      },
      {
        name: 'UpdatedAt',
        type: 'DATETIME2',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
      },
    ],
  },
  TestStepMemberships: {
    tableName: 'TestStepMemberships',
    columns: [
      {
        name: 'Id',
        type: 'UNIQUEIDENTIFIER',
        nullable: false,
        isPrimaryKey: true,
        isForeignKey: false,
      },
      {
        name: 'TestCaseId',
        type: 'UNIQUEIDENTIFIER',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: true,
        foreignKeyReference: {
          table: 'TestCases',
          column: 'Id',
        },
      },
      {
        name: 'CatalogStepId',
        type: 'UNIQUEIDENTIFIER',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: true,
        foreignKeyReference: {
          table: 'CatalogSteps',
          column: 'Id',
        },
      },
      {
        name: 'ProcessOrder',
        type: 'INT',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
      },
      {
        name: 'CreatedAt',
        type: 'DATETIME2',
        nullable: false,
        isPrimaryKey: false,
        isForeignKey: false,
      },
    ],
  },
};

export const CREATE_TABLE_STATEMENTS = {
  CatalogSteps: `
CREATE TABLE CatalogSteps (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    JavaClass NVARCHAR(500) NOT NULL,
    JavaMethod NVARCHAR(255) NOT NULL,
    SqlTables NVARCHAR(MAX),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
CREATE INDEX IX_CatalogSteps_Name ON CatalogSteps(Name);
CREATE INDEX IX_CatalogSteps_JavaClass ON CatalogSteps(JavaClass);
  `,
  TestCases: `
CREATE TABLE TestCases (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    Name NVARCHAR(255) NOT NULL,
    Description NVARCHAR(MAX),
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
CREATE INDEX IX_TestCases_Name ON TestCases(Name);
  `,
  TestStepMemberships: `
CREATE TABLE TestStepMemberships (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    TestCaseId UNIQUEIDENTIFIER NOT NULL,
    CatalogStepId UNIQUEIDENTIFIER NOT NULL,
    ProcessOrder INT NOT NULL,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT FK_Memberships_TestCases FOREIGN KEY (TestCaseId) 
        REFERENCES TestCases(Id) ON DELETE CASCADE,
    CONSTRAINT FK_Memberships_CatalogSteps FOREIGN KEY (CatalogStepId) 
        REFERENCES CatalogSteps(Id) ON DELETE CASCADE,
    CONSTRAINT UQ_TestCase_ProcessOrder UNIQUE (TestCaseId, ProcessOrder)
);
CREATE INDEX IX_Memberships_TestCaseId ON TestStepMemberships(TestCaseId);
CREATE INDEX IX_Memberships_CatalogStepId ON TestStepMemberships(CatalogStepId);
  `,
};

export function generateCreateTablesScript(): string {
  return Object.values(CREATE_TABLE_STATEMENTS).join('\n\n');
}
