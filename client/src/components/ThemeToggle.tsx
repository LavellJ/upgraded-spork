import React from 'react';
import { Eye, Contrast } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="flex items-center gap-2 h-8 px-3"
      data-testid="button-theme-toggle"
      title={`Switch to ${theme === 'default' ? 'High Contrast' : 'Default'} theme`}
    >
      {theme === 'default' ? (
        <Contrast className="h-4 w-4" />
      ) : (
        <Eye className="h-4 w-4" />
      )}
      <span className="text-xs">
        {theme === 'default' ? 'High Contrast' : 'Default'}
      </span>
    </Button>
  );
}