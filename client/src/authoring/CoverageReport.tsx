/**
 * Coverage Report Component
 * Displays content breadth analysis by biome, skill, and standards with CSV export
 */

import React, { useState, useMemo } from 'react';
import { 
  BarChart3, 
  Download, 
  FileSpreadsheet, 
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Target,
  BookOpen,
  Users
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { 
  buildCoverage, 
  missingStandards, 
  getFrameworkCodes, 
  exportBiomeCoverageCSV, 
  exportSkillCoverageCSV, 
  exportFrameworkCoverageCSV,
  downloadCSV,
  getCoverageSummary,
  type CoverageReport 
} from './coverage';
import { getFrameworks } from './registry';

const BIOMES = {
  forest: { label: 'Literacy', icon: '🌲', color: 'bg-green-100 text-green-800' },
  desert: { label: 'Math', icon: '🏜️', color: 'bg-orange-100 text-orange-800' },
  ocean: { label: 'Science', icon: '🌊', color: 'bg-blue-100 text-blue-800' },
  night: { label: 'HASS', icon: '🌙', color: 'bg-purple-100 text-purple-800' }
};

interface CoverageReportProps {
  className?: string;
}

export function CoverageReportComponent({ className }: CoverageReportProps) {
  const [selectedFramework, setSelectedFramework] = useState('ACARA');
  
  // Generate coverage data
  const coverage = useMemo(() => buildCoverage(), []);
  const summary = useMemo(() => getCoverageSummary(), []);
  const frameworks = useMemo(() => getFrameworks(), []);
  const frameworkOptions = Object.keys(frameworks);
  
  // Get missing standards for selected framework
  const frameworkCodes = getFrameworkCodes(selectedFramework);
  const missingCodes = useMemo(() => 
    missingStandards(selectedFramework, frameworkCodes), 
    [selectedFramework, frameworkCodes]
  );

  // Sort biomes and skills for display
  const sortedBiomes = Object.entries(coverage.byBiome)
    .sort(([,a], [,b]) => b.lessons - a.lessons);
  
  const sortedSkills = Object.entries(coverage.bySkill)
    .sort(([,a], [,b]) => a.lessons - b.lessons); // Ascending to show gaps first

  // Download handlers
  const handleDownloadBiomeCSV = () => {
    const csvData = exportBiomeCoverageCSV();
    downloadCSV('biome-coverage.csv', csvData);
  };

  const handleDownloadSkillCSV = () => {
    const csvData = exportSkillCoverageCSV();
    downloadCSV('skill-coverage.csv', csvData);
  };

  const handleDownloadFrameworkCSV = () => {
    const csvData = exportFrameworkCoverageCSV(selectedFramework);
    downloadCSV(`${selectedFramework.toLowerCase()}-standards-coverage.csv`, csvData);
  };

  const frameworkCoverage = coverage.byFramework[selectedFramework];
  const coveragePercentage = frameworkCoverage 
    ? Math.round((frameworkCoverage.covered.size / frameworkCoverage.codes.size) * 100)
    : 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Coverage Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.totalLessons}</div>
              <div className="text-sm text-gray-600">Total Lessons</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.totalBiomes}</div>
              <div className="text-sm text-gray-600">Biomes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{summary.totalSkills}</div>
              <div className="text-sm text-gray-600">Skills</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{summary.avgLessonsPerBiome.toFixed(1)}</div>
              <div className="text-sm text-gray-600">Avg per Biome</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Biome Coverage */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-green-600" />
              Biome Coverage
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadBiomeCSV}
              className="text-xs"
              data-testid="download-biome-csv"
            >
              <Download className="w-4 h-4 mr-1" />
              CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {sortedBiomes.map(([biomeId, data]) => {
              const biome = BIOMES[biomeId as keyof typeof BIOMES];
              return (
                <div key={biomeId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{biome?.icon}</span>
                    <div>
                      <div className="font-medium">{biome?.label || biomeId}</div>
                      <div className="text-sm text-gray-500">
                        {data.skills.size} skills • {data.standards.size} standards
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{data.lessons}</div>
                    <div className="text-xs text-gray-500">lessons</div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Skill Coverage */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-600" />
              Skill Coverage
              <Badge variant="outline" className="text-xs">Sorted by Count ↑</Badge>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadSkillCSV}
              className="text-xs"
              data-testid="download-skill-csv"
            >
              <Download className="w-4 h-4 mr-1" />
              CSV
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-y-auto">
            <div className="space-y-2">
              {sortedSkills.map(([skillId, data]) => (
                <div key={skillId} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{skillId}</code>
                    {data.lessons === 1 && (
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm">{data.lessons}</span>
                    <span className="text-xs text-gray-500">lessons</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {sortedSkills.length === 0 && (
            <div className="text-center py-4 text-gray-500">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No skills found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Standards Coverage */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-blue-600" />
              Standards Coverage
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={selectedFramework} onValueChange={setSelectedFramework}>
                <SelectTrigger className="w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {frameworkOptions.map(fw => (
                    <SelectItem key={fw} value={fw}>{fw}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadFrameworkCSV}
                className="text-xs"
                data-testid="download-framework-csv"
              >
                <Download className="w-4 h-4 mr-1" />
                CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {frameworkCoverage ? (
            <div className="space-y-4">
              {/* Coverage Stats */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Coverage: {coveragePercentage}%</span>
                </div>
                <div className="text-sm text-gray-600">
                  {frameworkCoverage.covered.size} of {frameworkCoverage.codes.size} standards
                </div>
              </div>

              {/* Missing Standards */}
              {missingCodes.length > 0 && (
                <div className="border border-amber-200 rounded-lg p-3 bg-amber-50">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="font-medium text-amber-800">Missing Standards ({missingCodes.length})</span>
                  </div>
                  <div className="max-h-32 overflow-y-auto">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                      {missingCodes.map(code => (
                        <code key={code} className="text-xs bg-white px-2 py-1 rounded border">
                          {code}
                        </code>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* All Standards List */}
              <div>
                <h4 className="font-medium mb-2 text-sm">All Standards</h4>
                <div className="max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1">
                    {Array.from(frameworkCoverage.codes).sort().map(code => {
                      const isCovered = frameworkCoverage.covered.has(code);
                      return (
                        <div
                          key={code}
                          className={`text-xs px-2 py-1 rounded border flex items-center justify-between ${
                            isCovered 
                              ? 'bg-green-50 border-green-200 text-green-800' 
                              : 'bg-gray-50 border-gray-200 text-gray-600'
                          }`}
                        >
                          <code>{code}</code>
                          {isCovered ? (
                            <CheckCircle2 className="w-3 h-3 text-green-600" />
                          ) : (
                            <span className="w-3 h-3 rounded-full bg-gray-300" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <FileSpreadsheet className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No framework data found</p>
              <p className="text-xs">Select a different framework or check registry</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}