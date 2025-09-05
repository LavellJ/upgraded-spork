// Audit Viewer v2 - Privacy-focused audit log explorer with filters and CSV export
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { useToast } from '../../hooks/use-toast';
import { loadAuth, type Auth } from '../../auth/model';
import {
  Download,
  Search,
  Calendar,
  Filter,
  Eye,
  EyeOff,
  Shield,
  User,
  Key
} from 'lucide-react';

interface AuditEntry {
  id: number;
  timestamp: string;
  email: string | null;
  action: string;
  meta: string | null;
  hasPII?: boolean;
}

interface AuditResponse {
  entries: AuditEntry[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
  filters: {
    q?: string;
    from?: string;
    to?: string;
    email?: string;
    action?: string;
    piiRedacted: boolean;
  };
}

type FilterChip = {
  label: string;
  icon: React.ReactNode;
  actions: string[];
};

/**
 * Audit Viewer v2 - Enhanced audit log explorer with privacy focus
 * Features: date filtering, action filtering, email search, CSV export, PII redaction toggle
 */
export function AuditViewer() {
  const [auth, setAuth] = useState<Auth>(() => loadAuth());
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [availableActions, setAvailableActions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [emailFilter, setEmailFilter] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [showPII, setShowPII] = useState(false);
  const [limit, setLimit] = useState(100);
  const [offset, setOffset] = useState(0);
  
  // Response data
  const [pagination, setPagination] = useState<AuditResponse['pagination'] | null>(null);
  
  const { toast } = useToast();

  // Filter chip presets for quick access
  const filterChips: FilterChip[] = [
    {
      label: 'Privacy Events',
      icon: <Shield className="h-4 w-4" />,
      actions: ['erasure_requested', 'erasure_canceled', 'erasure_done', 'dsar_export_requested', 'dsar_export_downloaded']
    },
    {
      label: 'Auth Events', 
      icon: <Key className="h-4 w-4" />,
      actions: ['token_issued', 'token_verification_failed', 'magic_link_sent', 'magic_link_rate_limited']
    },
    {
      label: 'Content Events',
      icon: <User className="h-4 w-4" />,
      actions: ['roster_updated', 'sync_batch_processed', 'collaborator_added', 'collaborator_removed']
    }
  ];

  // Load audit entries with current filters
  const loadAuditEntries = async (resetOffset = false) => {
    if (!auth.verified || !auth.token) {
      return;
    }

    setIsLoading(true);
    const currentOffset = resetOffset ? 0 : offset;
    
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (emailFilter) params.set('email', emailFilter);
      if (actionFilter) params.set('action', actionFilter);
      if (fromDate) params.set('from', new Date(fromDate).toISOString());
      if (toDate) params.set('to', new Date(toDate).toISOString());
      params.set('limit', limit.toString());
      params.set('offset', currentOffset.toString());
      params.set('pii', showPII ? '1' : '0');

      const response = await fetch(`/api/admin/audit?${params}`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load audit entries');
      }

      const data: AuditResponse = await response.json();
      setEntries(resetOffset ? data.entries : [...entries, ...data.entries]);
      setPagination(data.pagination);
      
      if (resetOffset) {
        setOffset(0);
      }

    } catch (error) {
      console.error('Error loading audit entries:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to load audit entries',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load available actions for filter dropdown
  const loadAvailableActions = async () => {
    if (!auth.verified || !auth.token) {
      return;
    }

    try {
      const response = await fetch('/api/admin/audit/actions', {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableActions(data.actions || []);
      }
    } catch (error) {
      console.error('Error loading available actions:', error);
    }
  };

  // Export current filter as CSV
  const exportCSV = async () => {
    if (!auth.verified || !auth.token) {
      return;
    }

    setIsExporting(true);
    
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (emailFilter) params.set('email', emailFilter);
      if (actionFilter) params.set('action', actionFilter);
      if (fromDate) params.set('from', new Date(fromDate).toISOString());
      if (toDate) params.set('to', new Date(toDate).toISOString());
      params.set('pii', showPII ? '1' : '0');

      const response = await fetch(`/api/admin/audit/csv?${params}`, {
        headers: {
          'Authorization': `Bearer ${auth.token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export CSV');
      }

      // Download the CSV file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Success',
        description: 'Audit log exported successfully',
        variant: 'default'
      });

    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to export CSV',
        variant: 'destructive'
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Apply filter chip preset
  const applyFilterChip = (chip: FilterChip) => {
    // Clear existing action filter and set to chip actions
    setActionFilter(chip.actions.join(','));
    setOffset(0);
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setEmailFilter('');
    setActionFilter('');
    setFromDate('');
    setToDate('');
    setOffset(0);
  };

  // Load more entries (pagination)
  const loadMore = () => {
    setOffset(offset + limit);
  };

  // Initial load
  useEffect(() => {
    if (auth.verified && auth.token) {
      loadAvailableActions();
      loadAuditEntries(true);
    }
  }, [auth]);

  // Reload when filters change
  useEffect(() => {
    if (auth.verified && auth.token) {
      const timeoutId = setTimeout(() => {
        loadAuditEntries(true);
      }, 300); // Debounce filter changes

      return () => clearTimeout(timeoutId);
    }
  }, [searchQuery, emailFilter, actionFilter, fromDate, toDate, showPII, limit]);

  // Load more when offset changes
  useEffect(() => {
    if (offset > 0 && auth.verified && auth.token) {
      loadAuditEntries(false);
    }
  }, [offset]);

  // Format timestamp for display
  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  // Format meta for display (truncated, monospace)
  const formatMeta = (meta: string | null) => {
    if (!meta) return '-';
    const truncated = meta.length > 100 ? meta.substring(0, 100) + '...' : meta;
    return truncated;
  };

  // Show sign-in prompt if not authenticated
  if (!auth.verified || !auth.token) {
    return (
      <div className="space-y-6" data-testid="audit-viewer">
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Shield className="h-8 w-8 text-orange-600" />
              <h3 className="text-lg font-semibold text-orange-900">Admin Access Required</h3>
            </div>
            <p className="text-sm text-orange-800 mb-4">
              You need to be signed in as admin or guide to view audit logs.
              Please sign in using the authentication panel.
            </p>
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
              className="text-orange-600 border-orange-200 hover:bg-orange-100"
            >
              Refresh After Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="audit-viewer">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Audit Log Viewer</h3>
          <p className="text-sm text-gray-600">
            Explore system events with privacy-focused filtering and export capabilities
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Shield className="h-3 w-3" />
            PII {showPII ? 'Visible' : 'Redacted'}
          </Badge>
          {pagination && (
            <Badge variant="secondary">
              {pagination.total} entries
            </Badge>
          )}
        </div>
      </div>

      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Filters</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                data-testid="clear-filters"
              >
                Clear All
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPII(!showPII)}
                className="gap-2"
                data-testid="toggle-pii"
              >
                {showPII ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showPII ? 'Hide PII' : 'Show PII'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          
          {/* Quick Filter Chips */}
          <div className="flex flex-wrap gap-2">
            {filterChips.map((chip) => (
              <Button
                key={chip.label}
                variant="outline"
                size="sm"
                onClick={() => applyFilterChip(chip)}
                className="gap-2"
                data-testid={`filter-chip-${chip.label.toLowerCase().replace(' ', '-')}`}
              >
                {chip.icon}
                {chip.label}
              </Button>
            ))}
          </div>

          {/* Filter Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Search */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search in action or meta..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                  data-testid="search-input"
                />
              </div>
            </div>

            {/* Email Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                placeholder="Filter by email..."
                value={emailFilter}
                onChange={(e) => setEmailFilter(e.target.value)}
                data-testid="email-filter"
              />
            </div>

            {/* Action Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Action</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger data-testid="action-filter">
                  <SelectValue placeholder="Select action..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Actions</SelectItem>
                  {availableActions.map((action) => (
                    <SelectItem key={action} value={action}>
                      {action}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <label className="text-sm font-medium">From Date</label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                data-testid="from-date"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">To Date</label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                data-testid="to-date"
              />
            </div>

            {/* Export Button */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Export</label>
              <Button 
                onClick={exportCSV}
                disabled={isExporting || !entries.length}
                className="w-full gap-2"
                data-testid="export-csv"
              >
                <Download className="h-4 w-4" />
                {isExporting ? 'Exporting...' : 'Download CSV'}
              </Button>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Results Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Meta</TableHead>
                  <TableHead>PII</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.length === 0 && !isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      No audit entries found
                    </TableCell>
                  </TableRow>
                ) : (
                  entries.map((entry) => (
                    <TableRow key={entry.id} data-testid={`audit-entry-${entry.id}`}>
                      <TableCell className="font-mono text-sm">
                        {formatTimestamp(entry.timestamp)}
                      </TableCell>
                      <TableCell>
                        {entry.email ? (
                          <Badge variant="secondary" className="text-xs">
                            {entry.email}
                          </Badge>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {entry.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs max-w-xs">
                        <div className="truncate" title={entry.meta || undefined}>
                          {formatMeta(entry.meta)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {entry.hasPII && (
                          <Badge variant="secondary" className="text-xs gap-1">
                            <Shield className="h-3 w-3" />
                            PII
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          {/* Loading and Load More */}
          {isLoading && (
            <div className="flex justify-center py-4">
              <div className="text-sm text-gray-500">Loading...</div>
            </div>
          )}
          
          {pagination?.hasMore && !isLoading && (
            <div className="flex justify-center py-4 border-t">
              <Button 
                variant="outline" 
                onClick={loadMore}
                data-testid="load-more"
              >
                Load More ({pagination.total - entries.length} remaining)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
    </div>
  );
}