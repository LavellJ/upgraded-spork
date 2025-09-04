import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock functions for roster import functionality
// Note: These would be implemented in client/src/roster/csvImport.ts
interface CSVRow {
  name: string;
  ageBand: 'pre-primary' | 'primary' | 'upper-primary';
  email?: string;
  id?: string;
}

interface CSVValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  parsedRows: CSVRow[];
  errorRows: Array<{ row: number; errors: string[] }>;
}

interface ClassCreationResult {
  classId: string;
  className: string;
  code: string;
  learnersAdded: number;
  warnings: string[];
}

// Mock CSV parser - in real implementation this would use a proper CSV library
function parseCSV(csvText: string): CSVValidationResult {
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  const requiredHeaders = ['name', 'ageband'];
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
  
  if (missingHeaders.length > 0) {
    return {
      isValid: false,
      errors: [`Missing required headers: ${missingHeaders.join(', ')}`],
      warnings: [],
      parsedRows: [],
      errorRows: []
    };
  }
  
  const parsedRows: CSVRow[] = [];
  const errorRows: Array<{ row: number; errors: string[] }> = [];
  const warnings: string[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const rowErrors: string[] = [];
    
    const name = values[headers.indexOf('name')];
    const ageBand = values[headers.indexOf('ageband')];
    const email = values[headers.indexOf('email')] || undefined;
    
    // Validate name
    if (!name || name.length < 2) {
      rowErrors.push('Name is required and must be at least 2 characters');
    }
    
    // Validate age band
    const validAgeBands = ['pre-primary', 'primary', 'upper-primary'];
    if (!ageBand || !validAgeBands.includes(ageBand)) {
      rowErrors.push(`Age band must be one of: ${validAgeBands.join(', ')}`);
    }
    
    // Validate email if provided
    if (email && email.length > 0 && !email.includes('@')) {
      rowErrors.push('Email format is invalid');
    }
    
    if (rowErrors.length > 0) {
      errorRows.push({ row: i + 1, errors: rowErrors });
    } else {
      // Check for duplicates
      const isDuplicate = parsedRows.some(row => row.name.toLowerCase() === name.toLowerCase());
      if (isDuplicate) {
        warnings.push(`Duplicate name found: ${name} (row ${i + 1})`);
      }
      
      parsedRows.push({
        name,
        ageBand: ageBand as CSVRow['ageBand'],
        email,
        id: `learner_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });
    }
  }
  
  return {
    isValid: errorRows.length === 0,
    errors: [],
    warnings,
    parsedRows,
    errorRows
  };
}

function createClassFromCSV(csvResult: CSVValidationResult, className: string): ClassCreationResult {
  if (!csvResult.isValid) {
    throw new Error('Cannot create class from invalid CSV data');
  }
  
  // Mock class creation
  const classId = `class_${Date.now()}`;
  const code = Math.random().toString(36).substr(2, 6).toUpperCase();
  
  return {
    classId,
    className,
    code,
    learnersAdded: csvResult.parsedRows.length,
    warnings: csvResult.warnings
  };
}

describe('CSV Roster Import', () => {
  beforeEach(() => {
    // Reset any mocked localStorage or other state
    vi.clearAllMocks();
  });

  describe('CSV Parsing', () => {
    it('should parse valid CSV with required headers', () => {
      const csvText = `name,ageband
Alice Smith,primary
Bob Johnson,pre-primary
Carol Davis,upper-primary`;

      const result = parseCSV(csvText);
      
      expect(result.isValid).toBe(true);
      expect(result.parsedRows).toHaveLength(3);
      expect(result.errorRows).toHaveLength(0);
      expect(result.parsedRows[0]).toMatchObject({
        name: 'Alice Smith',
        ageBand: 'primary'
      });
    });

    it('should parse CSV with optional email column', () => {
      const csvText = `name,ageband,email
Alice Smith,primary,alice@example.com
Bob Johnson,pre-primary,
Carol Davis,upper-primary,carol@school.edu`;

      const result = parseCSV(csvText);
      
      expect(result.isValid).toBe(true);
      expect(result.parsedRows[0].email).toBe('alice@example.com');
      expect(result.parsedRows[1].email).toBeUndefined();
      expect(result.parsedRows[2].email).toBe('carol@school.edu');
    });

    it('should reject CSV missing required headers', () => {
      const csvText = `firstname,grade
Alice Smith,3
Bob Johnson,1`;

      const result = parseCSV(csvText);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing required headers: name, ageband');
    });

    it('should validate age band values', () => {
      const csvText = `name,ageband
Alice Smith,invalid-age
Bob Johnson,primary
Carol Davis,grade-5`;

      const result = parseCSV(csvText);
      
      expect(result.isValid).toBe(false);
      expect(result.errorRows).toHaveLength(2);
      expect(result.errorRows[0].errors[0]).toContain('Age band must be one of');
      expect(result.errorRows[1].errors[0]).toContain('Age band must be one of');
    });

    it('should validate name requirements', () => {
      const csvText = `name,ageband
,primary
A,pre-primary
Valid Name,upper-primary`;

      const result = parseCSV(csvText);
      
      expect(result.isValid).toBe(false);
      expect(result.errorRows).toHaveLength(2);
      expect(result.errorRows[0].errors[0]).toContain('Name is required');
      expect(result.errorRows[1].errors[0]).toContain('must be at least 2 characters');
    });

    it('should validate email format when provided', () => {
      const csvText = `name,ageband,email
Alice Smith,primary,alice@example.com
Bob Johnson,pre-primary,invalid-email
Carol Davis,upper-primary,`;

      const result = parseCSV(csvText);
      
      expect(result.isValid).toBe(false);
      expect(result.errorRows).toHaveLength(1);
      expect(result.errorRows[0].errors[0]).toContain('Email format is invalid');
    });

    it('should detect duplicate names', () => {
      const csvText = `name,ageband
Alice Smith,primary
Bob Johnson,pre-primary
Alice Smith,upper-primary`;

      const result = parseCSV(csvText);
      
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain('Duplicate name found: Alice Smith (row 4)');
    });

    it('should handle multiple validation errors per row', () => {
      const csvText = `name,ageband,email
,invalid-age,bad-email
Valid Name,primary,good@email.com`;

      const result = parseCSV(csvText);
      
      expect(result.isValid).toBe(false);
      expect(result.errorRows).toHaveLength(1);
      expect(result.errorRows[0].errors).toHaveLength(3); // name, age band, email
    });
  });

  describe('Class Creation', () => {
    it('should create class from valid CSV data', () => {
      const csvResult: CSVValidationResult = {
        isValid: true,
        errors: [],
        warnings: [],
        parsedRows: [
          { name: 'Alice Smith', ageBand: 'primary', id: 'learner_1' },
          { name: 'Bob Johnson', ageBand: 'pre-primary', id: 'learner_2' }
        ],
        errorRows: []
      };

      const result = createClassFromCSV(csvResult, 'Grade 3A');
      
      expect(result.className).toBe('Grade 3A');
      expect(result.learnersAdded).toBe(2);
      expect(result.classId).toMatch(/^class_/);
      expect(result.code).toHaveLength(6);
    });

    it('should reject invalid CSV data', () => {
      const csvResult: CSVValidationResult = {
        isValid: false,
        errors: ['Missing required headers'],
        warnings: [],
        parsedRows: [],
        errorRows: [{ row: 2, errors: ['Name is required'] }]
      };

      expect(() => {
        createClassFromCSV(csvResult, 'Grade 3A');
      }).toThrow('Cannot create class from invalid CSV data');
    });

    it('should preserve warnings from CSV validation', () => {
      const csvResult: CSVValidationResult = {
        isValid: true,
        errors: [],
        warnings: ['Duplicate name found: Alice Smith'],
        parsedRows: [
          { name: 'Alice Smith', ageBand: 'primary', id: 'learner_1' },
          { name: 'Alice Smith', ageBand: 'upper-primary', id: 'learner_2' }
        ],
        errorRows: []
      };

      const result = createClassFromCSV(csvResult, 'Mixed Class');
      
      expect(result.warnings).toContain('Duplicate name found: Alice Smith');
    });
  });

  describe('Error Row Flagging', () => {
    it('should flag rows with missing required data', () => {
      const csvText = `name,ageband
Alice Smith,primary
,pre-primary
Carol Davis,`;

      const result = parseCSV(csvText);
      
      expect(result.errorRows).toHaveLength(2);
      expect(result.errorRows[0].row).toBe(3); // Empty name
      expect(result.errorRows[1].row).toBe(4); // Empty age band
    });

    it('should provide detailed error messages for each flagged row', () => {
      const csvText = `name,ageband,email
A,invalid,bad-email
Valid Name,primary,good@email.com`;

      const result = parseCSV(csvText);
      
      expect(result.errorRows).toHaveLength(1);
      expect(result.errorRows[0].row).toBe(2);
      expect(result.errorRows[0].errors).toContain('Name is required and must be at least 2 characters');
      expect(result.errorRows[0].errors).toContain('Age band must be one of: pre-primary, primary, upper-primary');
      expect(result.errorRows[0].errors).toContain('Email format is invalid');
    });

    it('should continue processing valid rows even when some rows have errors', () => {
      const csvText = `name,ageband
Alice Smith,primary
,invalid
Bob Johnson,pre-primary
Carol,missing-age`;

      const result = parseCSV(csvText);
      
      expect(result.isValid).toBe(false);
      expect(result.errorRows).toHaveLength(2);
      expect(result.parsedRows).toHaveLength(2); // Alice and Bob should still be parsed
      expect(result.parsedRows[0].name).toBe('Alice Smith');
      expect(result.parsedRows[1].name).toBe('Bob Johnson');
    });
  });

  describe('CSV Template Validation', () => {
    it('should accept standard template format', () => {
      const templateCSV = `name,ageband,email
Student Name,primary,student@example.com`;

      const result = parseCSV(templateCSV);
      
      expect(result.isValid).toBe(true);
      expect(result.parsedRows).toHaveLength(1);
    });

    it('should be case-insensitive for headers', () => {
      const csvText = `Name,AgeBand,Email
Alice Smith,primary,alice@example.com`;

      const result = parseCSV(csvText);
      
      expect(result.isValid).toBe(true);
      expect(result.parsedRows).toHaveLength(1);
    });

    it('should handle extra whitespace in headers and values', () => {
      const csvText = `  name  ,  ageband  ,  email  
  Alice Smith  ,  primary  ,  alice@example.com  `;

      const result = parseCSV(csvText);
      
      expect(result.isValid).toBe(true);
      expect(result.parsedRows[0].name).toBe('Alice Smith');
      expect(result.parsedRows[0].ageBand).toBe('primary');
    });
  });
});