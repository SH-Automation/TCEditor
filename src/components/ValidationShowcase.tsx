import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ValidatedInput } from './ValidatedInput';
import { 
  validateTCID, 
  validateJavaClassName, 
  validateJavaMethodName,
  validateSQLTableName,
  TCIDValidationResult,
  ValidationResult
} from '@/lib/validation';
import { CheckCircle, XCircle, Warning } from '@phosphor-icons/react';

export function ValidationShowcase() {
  const [tcidExample, setTcidExample] = useState('');
  const [javaClassExample, setJavaClassExample] = useState('');
  const [javaMethodExample, setJavaMethodExample] = useState('');
  const [sqlTableExample, setSqlTableExample] = useState('');

  const [validations, setValidations] = useState<{
    tcid?: TCIDValidationResult;
    javaClass?: ValidationResult;
    javaMethod?: ValidationResult;
    sqlTable?: ValidationResult;
  }>({});

  const [touched, setTouched] = useState({
    tcid: false,
    javaClass: false,
    javaMethod: false,
    sqlTable: false,
  });

  const handleTcidChange = (value: string) => {
    setTcidExample(value);
    if (touched.tcid) {
      setValidations(prev => ({ 
        ...prev, 
        tcid: validateTCID(value, [], undefined) 
      }));
    }
  };

  const handleJavaClassChange = (value: string) => {
    setJavaClassExample(value);
    if (touched.javaClass) {
      setValidations(prev => ({ 
        ...prev, 
        javaClass: validateJavaClassName(value) 
      }));
    }
  };

  const handleJavaMethodChange = (value: string) => {
    setJavaMethodExample(value);
    if (touched.javaMethod) {
      setValidations(prev => ({ 
        ...prev, 
        javaMethod: validateJavaMethodName(value) 
      }));
    }
  };

  const handleSqlTableChange = (value: string) => {
    setSqlTableExample(value);
    if (touched.sqlTable) {
      setValidations(prev => ({ 
        ...prev, 
        sqlTable: validateSQLTableName(value) 
      }));
    }
  };

  const handleBlur = (field: 'tcid' | 'javaClass' | 'javaMethod' | 'sqlTable') => {
    setTouched(prev => ({ ...prev, [field]: true }));
    
    switch (field) {
      case 'tcid':
        setValidations(prev => ({ 
          ...prev, 
          tcid: validateTCID(tcidExample, [], undefined) 
        }));
        break;
      case 'javaClass':
        setValidations(prev => ({ 
          ...prev, 
          javaClass: validateJavaClassName(javaClassExample) 
        }));
        break;
      case 'javaMethod':
        setValidations(prev => ({ 
          ...prev, 
          javaMethod: validateJavaMethodName(javaMethodExample) 
        }));
        break;
      case 'sqlTable':
        setValidations(prev => ({ 
          ...prev, 
          sqlTable: validateSQLTableName(sqlTableExample) 
        }));
        break;
    }
  };

  const examples = [
    {
      category: 'TCID Format',
      valid: ['TC-001', 'PROJECT-TC-123', 'TC-001-V1', 'AUTH-TC-0042-A'],
      invalid: ['tc-001', 'TC123', 'TC 001', 'TC-1', '123'],
    },
    {
      category: 'Java Class',
      valid: ['TestUtils', 'com.example.TestUtils', 'MyClass'],
      invalid: ['testUtils', 'com.example.testUtils', '1Class', 'my-class'],
    },
    {
      category: 'Java Method',
      valid: ['validateLogin', 'testUser', 'setUp', 'runTest'],
      invalid: ['ValidateLogin', 'test_user', '1test', 'test-method'],
    },
    {
      category: 'SQL Table',
      valid: ['users', 'test_cases', 'dbo.Users', 'schema_name.table_name'],
      invalid: ['1users', 'test-cases', 'user name', ''],
    },
  ];

  const getValidationIcon = (validation?: ValidationResult | TCIDValidationResult) => {
    if (!validation) return null;
    
    if (validation.isValid) {
      return <CheckCircle size={20} className="text-green-600" weight="fill" />;
    }
    
    if (validation.warningLevel === 'warning') {
      return <Warning size={20} className="text-accent" weight="fill" />;
    }
    
    return <XCircle size={20} className="text-destructive" weight="fill" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Input Validation System</CardTitle>
          <CardDescription>
            Intelligent validation with real-time feedback, format suggestions, and one-click corrections
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <ValidatedInput
                id="tcid-showcase"
                label="Test Case ID (TCID)"
                value={tcidExample}
                onChange={handleTcidChange}
                onBlur={() => handleBlur('tcid')}
                validation={touched.tcid ? validations.tcid : undefined}
                placeholder="Try: TC-001 or just 123"
                description="Type to see validation in action"
              />
              
              <ValidatedInput
                id="java-class-showcase"
                label="Java Class Name"
                value={javaClassExample}
                onChange={handleJavaClassChange}
                onBlur={() => handleBlur('javaClass')}
                validation={touched.javaClass ? validations.javaClass : undefined}
                placeholder="com.example.TestUtils"
                description="Fully qualified class name"
              />
            </div>

            <div className="space-y-4">
              <ValidatedInput
                id="java-method-showcase"
                label="Java Method Name"
                value={javaMethodExample}
                onChange={handleJavaMethodChange}
                onBlur={() => handleBlur('javaMethod')}
                validation={touched.javaMethod ? validations.javaMethod : undefined}
                placeholder="validateLogin"
                description="camelCase method name"
              />
              
              <ValidatedInput
                id="sql-table-showcase"
                label="SQL Table Name"
                value={sqlTableExample}
                onChange={handleSqlTableChange}
                onBlur={() => handleBlur('sqlTable')}
                validation={touched.sqlTable ? validations.sqlTable : undefined}
                placeholder="users or dbo.users"
                description="With optional schema prefix"
              />
            </div>
          </div>

          <div className="pt-4 border-t">
            <h4 className="font-semibold mb-3">Validation Examples</h4>
            <div className="grid gap-4 md:grid-cols-2">
              {examples.map((example) => (
                <div key={example.category} className="space-y-2">
                  <h5 className="text-sm font-medium text-muted-foreground">{example.category}</h5>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-green-600" weight="fill" />
                      <span className="text-sm font-medium">Valid:</span>
                    </div>
                    <div className="flex flex-wrap gap-1 ml-6">
                      {example.valid.map((val) => (
                        <Badge key={val} variant="outline" className="font-mono text-xs">
                          {val}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <XCircle size={14} className="text-destructive" weight="fill" />
                      <span className="text-sm font-medium">Invalid:</span>
                    </div>
                    <div className="flex flex-wrap gap-1 ml-6">
                      {example.invalid.map((val) => (
                        <Badge key={val} variant="outline" className="font-mono text-xs text-muted-foreground">
                          {val || '(empty)'}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t space-y-3">
            <h4 className="font-semibold">Key Features</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-primary mt-0.5 shrink-0" />
                <span><strong>Real-time Validation:</strong> Immediate feedback as you type (after initial blur)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-primary mt-0.5 shrink-0" />
                <span><strong>Smart Suggestions:</strong> Contextual help with specific format corrections</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-primary mt-0.5 shrink-0" />
                <span><strong>One-Click Fix:</strong> Apply button to automatically correct common issues</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-primary mt-0.5 shrink-0" />
                <span><strong>Uniqueness Checks:</strong> Prevents duplicate TCIDs and step names across system</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-primary mt-0.5 shrink-0" />
                <span><strong>Format Auto-Detection:</strong> Intelligently formats partial inputs (e.g., "123" → "TC-123")</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle size={16} className="text-primary mt-0.5 shrink-0" />
                <span><strong>Color-Coded Severity:</strong> Red for errors, orange for warnings, blue for info</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
