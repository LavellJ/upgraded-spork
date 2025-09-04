import React, { useState } from 'react';
import { Upload, Download, AlertTriangle, CheckCircle, Users, Plus } from 'lucide-react';
import { useRoster } from '../roster/context';
import { upsertClass, makeClassCode, getAllClasses } from '../roster/classes';
import { LearnerProfile } from '../roster/model';

interface CSVRow {
  name: string;
  ageBand: '5-6' | '7-8' | '9-10' | '11-12';
  avatarId?: string;
  className?: string;
}

interface ParsedRow {
  row: number;
  data: CSVRow;
  issues: string[];
}

interface ImportSummary {
  learnersAdded: number;
  classesCreated: number;
  errors: number;
}

const SAMPLE_CSV = `name,ageBand,avatarId,className
Emma Wilson,7-8,avatar-3,Room 12A
Jake Thompson,7-8,,Room 12A
Sophia Chen,8-9,avatar-7,Room 12A
Liam O'Connor,7-8,avatar-2,Room 12B
Olivia Rodriguez,8-9,,Room 12B`;

export function RosterImport() {
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const { createLearner } = useRoster();

  // Parse CSV data
  const handleParseCsv = () => {
    if (!csvText.trim()) {
      setParsedRows([]);
      return;
    }

    const lines = csvText.trim().split('\n');
    if (lines.length < 2) {
      setParsedRows([{
        row: 1,
        data: { name: '', ageBand: '7-8' },
        issues: ['CSV must have at least a header and one data row']
      }]);
      return;
    }

    const header = lines[0].toLowerCase().split(',').map(h => h.trim());
    const requiredHeaders = ['name', 'ageband'];
    const missingHeaders = requiredHeaders.filter(h => !header.includes(h));
    
    if (missingHeaders.length > 0) {
      setParsedRows([{
        row: 1,
        data: { name: '', ageBand: '7-8' },
        issues: [`Missing required headers: ${missingHeaders.join(', ')}`]
      }]);
      return;
    }

    const nameIndex = header.indexOf('name');
    const ageBandIndex = header.indexOf('ageband');
    const avatarIdIndex = header.indexOf('avatarid');
    const classNameIndex = header.indexOf('classname');

    const parsed: ParsedRow[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const cells = lines[i].split(',').map(c => c.trim());
      const issues: string[] = [];
      
      const name = cells[nameIndex] || '';
      const ageBand = cells[ageBandIndex] || '';
      const avatarId = avatarIdIndex >= 0 ? cells[avatarIdIndex] : undefined;
      const className = classNameIndex >= 0 ? cells[classNameIndex] : undefined;

      // Validate name
      if (!name) {
        issues.push('Name is required');
      }

      // Validate age band
      const validAgeBands = ['5-6', '7-8', '9-10', '11-12'];
      if (!ageBand) {
        issues.push('Age band is required');
      } else if (!validAgeBands.includes(ageBand)) {
        issues.push(`Age band must be one of: ${validAgeBands.join(', ')}`);
      }

      // Validate avatar ID if provided
      if (avatarId && !/^avatar-\d+$/.test(avatarId)) {
        issues.push('Avatar ID must be in format: avatar-1, avatar-2, etc.');
      }

      parsed.push({
        row: i + 1,
        data: {
          name,
          ageBand: ageBand as CSVRow['ageBand'],
          avatarId: avatarId || undefined,
          className: className || undefined
        },
        issues
      });
    }

    setParsedRows(parsed);
  };

  // Import the parsed data
  const handleImport = async () => {
    if (parsedRows.some(row => row.issues.length > 0)) {
      return; // Don't import if there are validation issues
    }

    setIsImporting(true);
    setImportSummary(null);
    
    try {
      const userId = 'local-1'; // TODO: Get from user context
      const classesCreated = new Set<string>();
      let learnersAdded = 0;
      let errors = 0;

      for (const { data } of parsedRows) {
        try {
          // Create or get class if className is provided
          let classId: string | undefined;
          
          if (data.className) {
            // Check if class already exists
            const existingClasses = getAllClasses(userId);
            let existingClass = existingClasses.find(c => c.name === data.className);
            
            if (!existingClass) {
              // Create new class
              existingClass = upsertClass(userId, {
                id: `class-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name: data.className
              });
              classesCreated.add(existingClass.name);
            }
            
            classId = existingClass.id;
          }

          // Create learner
          const ageBandMap: Record<string, LearnerProfile['ageBand']> = {
            '5-6': 'pre-primary',
            '7-8': 'primary', 
            '9-10': 'primary',
            '11-12': 'upper-primary'
          };

          await createLearner(
            data.name,
            data.avatarId || 'avatar-1',
            ageBandMap[data.ageBand] || 'primary'
          );
          
          learnersAdded++;
        } catch (error) {
          console.error('Error importing row:', error);
          errors++;
        }
      }

      setImportSummary({
        learnersAdded,
        classesCreated: classesCreated.size,
        errors
      });

      // Clear the form on successful import
      if (errors === 0) {
        setCsvText('');
        setParsedRows([]);
      }
    } catch (error) {
      console.error('Import failed:', error);
    } finally {
      setIsImporting(false);
    }
  };

  // Download sample CSV template
  const handleDownloadTemplate = () => {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'roster-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const hasValidationErrors = parsedRows.some(row => row.issues.length > 0);
  const totalRows = parsedRows.length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Import Class Roster</h3>
          <p className="text-sm text-gray-600">
            Upload a CSV file to add multiple learners and organize them into classes
          </p>
        </div>
        <button
          onClick={handleDownloadTemplate}
          className="flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          data-testid="button-download-template"
        >
          <Download className="h-4 w-4" />
          Download Template
        </button>
      </div>

      {/* CSV Input */}
      <div className="space-y-2">
        <label htmlFor="csv-input" className="block text-sm font-medium text-gray-700">
          CSV Data
        </label>
        <textarea
          id="csv-input"
          value={csvText}
          onChange={(e) => setCsvText(e.target.value)}
          onBlur={handleParseCsv}
          placeholder="Paste your CSV data here or use the template above..."
          className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          data-testid="textarea-csv-input"
        />
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <AlertTriangle className="h-3 w-3" />
          Required columns: name, ageBand. Optional: avatarId, className
        </div>
      </div>

      {/* Parse Button */}
      {csvText.trim() && (
        <button
          onClick={handleParseCsv}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          data-testid="button-parse-csv"
        >
          Parse CSV
        </button>
      )}

      {/* Preview Table */}
      {parsedRows.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-900">Preview</h4>
            <div className="text-sm text-gray-600">
              {totalRows} rows • {parsedRows.filter(r => r.issues.length === 0).length} valid
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Row</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Age Band</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avatar</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {parsedRows.map((row) => (
                    <tr key={row.row} className={row.issues.length > 0 ? 'bg-red-50' : ''}>
                      <td className="px-3 py-2 text-sm text-gray-900">{row.row}</td>
                      <td className="px-3 py-2 text-sm text-gray-900">{row.data.name || '—'}</td>
                      <td className="px-3 py-2 text-sm text-gray-900">{row.data.ageBand || '—'}</td>
                      <td className="px-3 py-2 text-sm text-gray-900">{row.data.avatarId || 'auto'}</td>
                      <td className="px-3 py-2 text-sm text-gray-900">{row.data.className || '—'}</td>
                      <td className="px-3 py-2">
                        {row.issues.length === 0 ? (
                          <div className="flex items-center gap-1 text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            <span className="text-xs">Valid</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-red-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-xs">{row.issues.length} error(s)</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Error List */}
          {hasValidationErrors && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h5 className="text-sm font-medium text-red-800 mb-2">Validation Errors</h5>
              <ul className="space-y-1 text-sm text-red-700">
                {parsedRows
                  .filter(row => row.issues.length > 0)
                  .map(row => 
                    row.issues.map((issue, i) => (
                      <li key={`${row.row}-${i}`}>
                        Row {row.row}: {issue}
                      </li>
                    ))
                  )}
              </ul>
            </div>
          )}

          {/* Import Button */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Ready to import {parsedRows.filter(r => r.issues.length === 0).length} learners
            </div>
            <button
              onClick={handleImport}
              disabled={hasValidationErrors || isImporting || parsedRows.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="button-import"
            >
              {isImporting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Import Roster
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Import Summary */}
      {importSummary && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800 mb-2">
            <CheckCircle className="h-5 w-5" />
            <h5 className="font-medium">Import Complete</h5>
          </div>
          <div className="space-y-1 text-sm text-green-700">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Added {importSummary.learnersAdded} learners
            </div>
            <div className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Created {importSummary.classesCreated} new classes
            </div>
            {importSummary.errors > 0 && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                {importSummary.errors} errors occurred
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}