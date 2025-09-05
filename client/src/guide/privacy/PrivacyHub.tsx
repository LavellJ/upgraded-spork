import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { 
  Shield, 
  FileText, 
  Database, 
  Cookie, 
  Download, 
  Trash2, 
  ExternalLink,
  AlertCircle,
  Users,
  Eye
} from 'lucide-react';

/**
 * Privacy & Data Hub - Central location for privacy documentation and data management
 * Provides teachers with easy access to privacy compliance docs and data controls
 */
export function PrivacyHub() {
  
  const handleExportData = () => {
    // TODO: Implement teacher data export functionality
    console.log('Exporting teacher data...');
  };

  const handleExportLearner = () => {
    // TODO: Implement learner data export functionality  
    console.log('Exporting learner data...');
  };

  const handleDeleteLearner = () => {
    // TODO: Implement learner deletion functionality
    console.log('Delete learner account...');
  };

  const handleClearLocalData = () => {
    // Clear local storage data
    const confirmed = confirm('This will clear all local learning progress and preferences. Are you sure?');
    if (confirmed) {
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  const privacyDocs = [
    {
      title: 'Privacy Summary',
      description: 'Plain-language overview of what we collect and why',
      icon: Shield,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      file: 'PRIVACY_SUMMARY.md'
    },
    {
      title: 'FERPA Overview',
      description: 'School Official roles, parent rights, and educational records',
      icon: FileText,
      color: 'text-green-600', 
      bgColor: 'bg-green-50',
      file: 'FERPA_OVERVIEW.md'
    },
    {
      title: 'GDPR Overview', 
      description: 'Controller/processor roles, legal bases, and data subject rights',
      icon: Eye,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50', 
      file: 'GDPR_OVERVIEW.md'
    },
    {
      title: 'Data Map',
      description: 'Complete inventory of data collection, storage, and retention',
      icon: Database,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      file: 'DATA_MAP.md'
    },
    {
      title: 'Cookies & Local Storage',
      description: 'Browser storage inventory and privacy controls',
      icon: Cookie,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      file: 'COOKIES_AND_LOCAL_STORAGE.md'
    },
    {
      title: 'DPA Template',
      description: 'Data Processing Agreement template for institutional use',
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      file: 'DPA_TEMPLATE.md'
    }
  ];

  const openDocumentation = (file: string) => {
    // Open documentation in new tab - could be GitHub blob or docs viewer
    const baseUrl = process.env.NODE_ENV === 'development' 
      ? 'https://github.com/your-org/learnoz/blob/main/docs/' 
      : '/docs/';
    window.open(`${baseUrl}${file}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6" data-testid="privacy-hub">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Privacy & Data</h2>
          <p className="text-gray-600 mt-1">
            Privacy documentation, compliance resources, and data management tools
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          FERPA/GDPR Compliant
        </Badge>
      </div>

      {/* Privacy Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-blue-900">Privacy-First Design</h3>
              <p className="text-sm text-blue-800 mt-1">
                LearnOz is built with privacy by design. Most data stays on your device, 
                and we collect only what's necessary for educational purposes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy Documentation */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Privacy Documentation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {privacyDocs.map((doc) => {
            const IconComponent = doc.icon;
            return (
              <Card 
                key={doc.file}
                className="hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => openDocumentation(doc.file)}
                data-testid={`privacy-doc-${doc.file.replace('.md', '').toLowerCase()}`}
              >
                <CardHeader className="pb-3">
                  <div className={`w-12 h-12 rounded-lg ${doc.bgColor} flex items-center justify-center mb-3`}>
                    <IconComponent className={`h-6 w-6 ${doc.color}`} />
                  </div>
                  <CardTitle className="text-base">{doc.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-gray-600 mb-3">{doc.description}</p>
                  <div className="flex items-center text-xs text-blue-600">
                    <span>Open documentation</span>
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Data Management Actions */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Data Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Export Data */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Download className="h-5 w-5 text-blue-600" />
                Export Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                Export data for compliance requests, backups, or migration to other systems.
              </p>
              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExportData}
                  data-testid="export-teacher-data-button"
                >
                  Export My Teacher Data
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleExportLearner}
                  data-testid="export-learner-data-button"
                >
                  Export Learner Data
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Delete Data */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-600" />
                Delete Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-600">
                Permanently remove data from local storage or request account deletion.
              </p>
              <div className="flex flex-col gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleClearLocalData}
                  className="text-orange-600 border-orange-200 hover:bg-orange-50"
                  data-testid="clear-local-data-button"
                >
                  Clear Local Data
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleDeleteLearner}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                  data-testid="delete-learner-button"
                >
                  Delete Learner Account
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Compliance Information */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-base">Compliance & Legal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900">FERPA Compliant</h4>
              <p className="text-gray-600">
                Operates as School Official with legitimate educational interests
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">GDPR Ready</h4>
              <p className="text-gray-600">
                Full data subject rights support with EU data residency
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900">COPPA Safe</h4>
              <p className="text-gray-600">
                No behavioral advertising or unauthorized data collection
              </p>
            </div>
          </div>
          <div className="border-t pt-3 mt-3">
            <p className="text-xs text-gray-500">
              For privacy questions or data requests, contact your school's data protection officer 
              or privacy coordinator. Technical support available through your school administrator.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}