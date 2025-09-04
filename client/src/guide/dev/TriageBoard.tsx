/**
 * Development Triage Board
 * Bug-bash feedback prioritization interface for pilot issues
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Checkbox } from '../../components/ui/checkbox';
import { Badge } from '../../components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';
import { Separator } from '../../components/ui/separator';
import { ScrollArea } from '../../components/ui/scroll-area';
import { 
  AlertTriangle, 
  Lightbulb, 
  HelpCircle, 
  Star, 
  Download, 
  ExternalLink,
  Copy,
  Clock
} from 'lucide-react';

import { buildTriage, exportTriageCSV, type TriageItem } from '../../feedback/triage';
import { listFeedback, type Feedback } from '../../feedback/model';

interface TriageBoardProps {
  userId?: string;
}

/**
 * Area route mapping for navigation links
 */
const AREA_ROUTES: Record<string, string> = {
  scout: '/quest-island',
  journal: '/journal',
  assignments: '/assignments',
  reports: '/guide/reports',
  classroom: '/guide/classes',
  auth: '/auth',
  media: '/media',
  other: '/',
};

/**
 * Get area icon component
 */
function getAreaIcon(area: string) {
  switch (area) {
    case 'scout': return '🤖';
    case 'journal': return '📔';
    case 'assignments': return '📚';
    case 'reports': return '📊';
    case 'classroom': return '🏫';
    case 'auth': return '🔐';
    case 'media': return '🎬';
    default: return '❓';
  }
}

/**
 * Get severity color class
 */
function getSeverityColor(severity: TriageItem['severity']) {
  switch (severity) {
    case 'p0': return 'bg-red-100 text-red-800 border-red-200';
    case 'p1': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'p2': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  }
}

/**
 * Individual triage item card
 */
function TriageItemCard({ 
  item, 
  isInTop10, 
  onToggleTop10 
}: { 
  item: TriageItem; 
  isInTop10: boolean; 
  onToggleTop10: (id: string, checked: boolean) => void; 
}) {
  const [idCopied, setIdCopied] = useState(false);

  const handleCopyId = async () => {
    try {
      await navigator.clipboard.writeText(item.id);
      setIdCopied(true);
      setTimeout(() => setIdCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy ID:', error);
    }
  };

  const handleOpenArea = () => {
    const route = AREA_ROUTES[item.area] || '/';
    window.open(route, '_blank');
  };

  return (
    <Card className="mb-3 border-l-4 border-l-gray-200 hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className={getSeverityColor(item.severity)}>
                {item.severity.toUpperCase()}
              </Badge>
              <Badge variant="secondary">
                {getAreaIcon(item.area)} {item.area}
              </Badge>
              {item.count > 1 && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  {item.count}x
                </Badge>
              )}
            </div>
            <h4 className="font-medium text-sm leading-tight text-gray-900">
              {item.title}
            </h4>
          </div>
          <div className="flex items-center gap-1">
            <Checkbox
              checked={isInTop10}
              onCheckedChange={(checked) => onToggleTop10(item.id, checked as boolean)}
              data-testid={`checkbox-top10-${item.id}`}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="text-xs text-gray-600 mb-2">
          {item.kind === 'bug' && <AlertTriangle className="inline w-3 h-3 mr-1" />}
          {item.kind === 'idea' && <Lightbulb className="inline w-3 h-3 mr-1" />}
          {item.kind === 'confusion' && <HelpCircle className="inline w-3 h-3 mr-1" />}
          {item.kind === 'nps' && <Star className="inline w-3 h-3 mr-1" />}
          <span className="capitalize">{item.kind}</span>
          <span className="mx-2">•</span>
          <Clock className="inline w-3 h-3 mr-1" />
          {new Date(item.lastSeenAt).toLocaleDateString()}
        </div>
        
        {item.sample && (
          <p className="text-xs text-gray-700 mb-3 line-clamp-2">
            {item.sample.text.substring(0, 120)}
            {item.sample.text.length > 120 && '...'}
          </p>
        )}
        
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleCopyId}
                  data-testid={`copy-id-${item.id}`}
                >
                  <Copy className="w-3 h-3" />
                  {idCopied ? 'Copied!' : 'ID'}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Copy triage ID</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleOpenArea}
                  data-testid={`open-area-${item.id}`}
                >
                  <ExternalLink className="w-3 h-3" />
                  Open
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open {item.area} area</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Triage column component
 */
function TriageColumn({ 
  title, 
  items, 
  top10Items, 
  onToggleTop10, 
  className = '' 
}: {
  title: string;
  items: TriageItem[];
  top10Items: Set<string>;
  onToggleTop10: (id: string, checked: boolean) => void;
  className?: string;
}) {
  return (
    <div className={`flex-1 min-w-0 ${className}`}>
      <div className="bg-gray-50 rounded-lg p-4 h-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <Badge variant="secondary">{items.length}</Badge>
        </div>
        
        <ScrollArea className="h-[600px]">
          {items.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-8">
              No items in this category
            </p>
          ) : (
            items.map(item => (
              <TriageItemCard
                key={item.id}
                item={item}
                isInTop10={top10Items.has(item.id)}
                onToggleTop10={onToggleTop10}
              />
            ))
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

/**
 * Main Triage Board component
 */
export function TriageBoard({ userId = 'dev-user' }: TriageBoardProps) {
  const [top10Items, setTop10Items] = useState<Set<string>>(new Set());

  // Load and process feedback data
  const triageItems = useMemo(() => {
    try {
      const feedback = listFeedback(userId);
      // For now, we'll use the same feedback array for both feed and issues
      // In production, these might come from different sources
      return buildTriage(feedback, []);
    } catch (error) {
      console.error('Failed to build triage:', error);
      return [];
    }
  }, [userId]);

  // Categorize items
  const categorizedItems = useMemo(() => {
    const topPriority = triageItems.filter(item => 
      item.severity === 'p0' || item.severity === 'p1'
    );
    const p2Items = triageItems.filter(item => item.severity === 'p2');
    const ideaItems = triageItems.filter(item => item.kind === 'idea');

    return { topPriority, p2Items, ideaItems };
  }, [triageItems]);

  const handleToggleTop10 = (id: string, checked: boolean) => {
    setTop10Items(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  };

  const handleExportCSV = () => {
    const csvData = exportTriageCSV(triageItems);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `triage-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const exportTop10CSV = () => {
    const top10Selected = triageItems.filter(item => top10Items.has(item.id));
    const csvData = exportTriageCSV(top10Selected);
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `top10-triage-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Pilot Triage Board</h1>
            <p className="text-gray-600">Bug-bash feedback prioritization and tracking</p>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={exportTop10CSV}
              disabled={top10Items.size === 0}
              data-testid="export-top10-csv"
            >
              <Download className="w-4 h-4 mr-2" />
              Export Top 10
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportCSV}
              data-testid="export-all-csv"
            >
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="flex gap-4 text-sm text-gray-600">
          <span>Total Items: {triageItems.length}</span>
          <Separator orientation="vertical" className="h-4" />
          <span>P0: {triageItems.filter(i => i.severity === 'p0').length}</span>
          <span>P1: {triageItems.filter(i => i.severity === 'p1').length}</span>
          <span>P2: {triageItems.filter(i => i.severity === 'p2').length}</span>
          <Separator orientation="vertical" className="h-4" />
          <span>Top 10 Selected: {top10Items.size}</span>
        </div>
      </div>

      {/* Triage Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TriageColumn
          title="🔥 Top Priority (P0/P1)"
          items={categorizedItems.topPriority}
          top10Items={top10Items}
          onToggleTop10={handleToggleTop10}
        />
        
        <TriageColumn
          title="⚡ P2 Issues"
          items={categorizedItems.p2Items}
          top10Items={top10Items}
          onToggleTop10={handleToggleTop10}
        />
        
        <TriageColumn
          title="💡 Ideas & Enhancements"
          items={categorizedItems.ideaItems}
          top10Items={top10Items}
          onToggleTop10={handleToggleTop10}
        />
      </div>

      {/* Development Notes */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="mt-6 border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <h4 className="font-medium text-blue-900 mb-2">Development Notes</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Feedback loaded from localStorage for user: {userId}</li>
              <li>• Area classification uses keyword matching</li>
              <li>• Severity assigned via heuristics (crash/cannot → P0, stuck/broken → P1)</li>
              <li>• Items deduplicated by kind + normalized title hash</li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}