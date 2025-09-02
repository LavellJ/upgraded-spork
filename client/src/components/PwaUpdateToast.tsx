import React from 'react';
import { usePwaUpdate } from '../pwa/usePwaUpdate';
import { useToast } from '../hooks/use-toast';
import { Button } from './ui/button';
import { Download, RefreshCw } from 'lucide-react';

export function PwaUpdateToast() {
  const { updateAvailable, showInstallPrompt, reloadApp, installApp } = usePwaUpdate();
  const { toast } = useToast();

  React.useEffect(() => {
    if (updateAvailable) {
      toast({
        title: "Update Available",
        description: "A new version of Quest Island is ready!",
        duration: 0, // Don't auto-dismiss
        action: (
          <Button 
            size="sm" 
            onClick={reloadApp}
            data-testid="update-app-button"
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Update
          </Button>
        ),
      });
    }
  }, [updateAvailable, toast, reloadApp]);

  React.useEffect(() => {
    if (showInstallPrompt) {
      toast({
        title: "Install Quest Island",
        description: "Add Quest Island to your home screen for the best experience!",
        duration: 10000, // Show for 10 seconds
        action: (
          <Button 
            size="sm" 
            onClick={installApp}
            data-testid="install-app-button"
            className="bg-sky-500 hover:bg-sky-600 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Install
          </Button>
        ),
      });
    }
  }, [showInstallPrompt, toast, installApp]);

  return null; // This component only manages toasts, no UI
}