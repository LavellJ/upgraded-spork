import React, { useState } from 'react';
import { Download, Filter, Plus, Search, MoreVertical, User, Calendar, TrendingUp } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from './table';
import { Toolbar, ToolbarLeft, ToolbarRight, ToolbarSeparator } from './toolbar';
import { Input } from './input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './select';
import { MultiSelect } from './multi-select';
import { DateRangePicker } from './date-range';
import { Button } from './button';
import { Badge } from './badge';
import { GuideShell, PageHeader } from '../layout';

export function EnhancedUIDemo() {
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>(['design', 'frontend']);
  const [dateRange, setDateRange] = useState<any>();
  const [sortField, setSortField] = useState<string>('none');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | 'none'>('none');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : prev === 'desc' ? 'none' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sampleData = [
    { id: 1, name: 'Alice Johnson', role: 'Designer', status: 'Active', progress: 85, lastActive: '2024-01-15' },
    { id: 2, name: 'Bob Smith', role: 'Developer', status: 'Active', progress: 92, lastActive: '2024-01-14' },
    { id: 3, name: 'Carol Davis', role: 'Manager', status: 'Inactive', progress: 67, lastActive: '2024-01-10' },
  ];

  const tagOptions = [
    { value: 'design', label: 'Design' },
    { value: 'frontend', label: 'Frontend' },
    { value: 'backend', label: 'Backend' },
    { value: 'testing', label: 'Testing' },
    { value: 'documentation', label: 'Documentation' },
  ];

  return (
    <GuideShell>
      <div className=\"space-y-6\">
        <PageHeader
          title=\"Enhanced UI Components\"
          subtitle=\"Standardized components with design tokens and density support\"
          breadcrumbs={[
            { label: 'Dashboard' },
            { label: 'Components' },
            { label: 'Enhanced Demo' }
          ]}
          actions={[
            {
              label: 'Export',
              icon: Download,
              onClick: () => console.log('Export'),
              variant: 'outline'
            },
            {
              label: 'Add User',
              icon: Plus,
              onClick: () => console.log('Add'),
              variant: 'default'
            }
          ]}
        />

        {/* Enhanced Card with Toolbar */}
        <Card>
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Manage your team with enhanced UI components</CardDescription>
          </CardHeader>
          
          {/* Toolbar with filters and search */}
          <Toolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder=\"Search team members...\"
            leftContent={
              <>
                <Select value=\"all\" onValueChange={() => {}}>
                  <SelectTrigger className=\"w-32\">
                    <SelectValue placeholder=\"Role\" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=\"all\">All Roles</SelectItem>
                    <SelectItem value=\"designer\">Designer</SelectItem>
                    <SelectItem value=\"developer\">Developer</SelectItem>
                    <SelectItem value=\"manager\">Manager</SelectItem>
                  </SelectContent>
                </Select>
                
                <MultiSelect
                  options={tagOptions}
                  value={selectedTags}
                  onChange={setSelectedTags}
                  placeholder=\"Tags...\"
                  className=\"w-48\"
                />
                
                <DateRangePicker
                  value={dateRange}
                  onChange={setDateRange}
                  className=\"w-56\"
                />
              </>
            }
            rightContent={
              <>
                <Button variant=\"outline\" size=\"sm\">
                  <Filter className=\"h-4 w-4 mr-1\" />
                  Filter
                </Button>
                <Button variant=\"outline\" size=\"sm\">
                  <MoreVertical className=\"h-4 w-4\" />
                </Button>
              </>
            }
          />
          
          <CardContent className=\"p-0\">
            {/* Enhanced Table with sorting */}
            <Table>
              <TableHeader sticky>
                <TableRow>
                  <TableHead 
                    sortable 
                    sortDirection={sortField === 'name' ? sortDirection : 'none'}
                    onSort={() => handleSort('name')}
                  >
                    Name
                  </TableHead>
                  <TableHead 
                    sortable 
                    sortDirection={sortField === 'role' ? sortDirection : 'none'}
                    onSort={() => handleSort('role')}
                  >
                    Role
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead 
                    sortable 
                    sortDirection={sortField === 'progress' ? sortDirection : 'none'}
                    onSort={() => handleSort('progress')}
                  >
                    Progress
                  </TableHead>
                  <TableHead>Last Active</TableHead>
                  <TableHead className=\"w-[100px]\">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sampleData.map(user => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className=\"flex items-center gap-2\">
                        <User className=\"h-4 w-4 text-fg-muted\" />
                        <span className=\"font-medium\">{user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === 'Active' ? 'default' : 'secondary'}>
                        {user.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className=\"flex items-center gap-2\">
                        <div className=\"w-12 h-2 bg-bg-soft rounded-full overflow-hidden\">
                          <div 
                            className=\"h-full bg-brand transition-all\" 
                            style={{ width: `${user.progress}%` }}
                          />
                        </div>
                        <span className=\"text-sm text-fg-muted\">{user.progress}%</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className=\"flex items-center gap-1 text-sm text-fg-muted\">
                        <Calendar className=\"h-3 w-3\" />
                        {user.lastActive}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant=\"ghost\" size=\"sm\">
                        <MoreVertical className=\"h-4 w-4\" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Form Examples */}
        <div className=\"grid grid-cols-1 md:grid-cols-2 gap-6\">
          <Card>
            <CardHeader>
              <CardTitle>Form Controls</CardTitle>
              <CardDescription>Enhanced form inputs with validation</CardDescription>
            </CardHeader>
            <CardContent className=\"space-y-4\">
              <Input 
                placeholder=\"Enter your name\" 
                helpText=\"This will be displayed publicly\"
              />
              <Input 
                placeholder=\"Enter email\" 
                error=\"Please enter a valid email address\"
              />
              <Select>
                <SelectTrigger helpText=\"Choose your preferred role\">
                  <SelectValue placeholder=\"Select role\" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=\"developer\">Developer</SelectItem>
                  <SelectItem value=\"designer\">Designer</SelectItem>
                  <SelectItem value=\"manager\">Manager</SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metrics Overview</CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent>
              <div className=\"grid grid-cols-2 gap-4\">
                <div className=\"space-y-1\">
                  <div className=\"flex items-center gap-1 text-sm text-fg-muted\">
                    <TrendingUp className=\"h-4 w-4\" />
                    Active Users
                  </div>
                  <div className=\"text-2xl font-bold text-brand\">2,847</div>
                </div>
                <div className=\"space-y-1\">
                  <div className=\"text-sm text-fg-muted\">Completion Rate</div>
                  <div className=\"text-2xl font-bold text-positive\">94.2%</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className=\"subtle text-center py-4\">
          Components use design tokens and support both comfortable and compact density modes.
        </div>
      </div>
    </GuideShell>
  );
}