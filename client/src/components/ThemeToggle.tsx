import React from 'react';
import { Monitor, Sun, Moon, Contrast, Eye, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useTheme, type ThemeMode, type ContrastMode, type DensityMode } from '@/hooks/useTheme';

// Legacy ThemeToggle component for backwards compatibility
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

// New comprehensive Appearance Settings component
export function AppearanceSettings() {
  const { settings, updateSettings } = useTheme();

  const getThemeIcon = (theme: ThemeMode) => {
    switch (theme) {
      case 'light': return <Sun className="h-4 w-4" />;
      case 'dark': return <Moon className="h-4 w-4" />;
      default: return <Monitor className="h-4 w-4" />;
    }
  };

  const getDensityIcon = (density: DensityMode) => {
    return density === 'compact' ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />;
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Appearance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Theme Selection */}
        <div className="space-y-2">
          <Label htmlFor="theme-select" className="text-sm font-medium">
            Theme
          </Label>
          <Select 
            value={settings.theme} 
            onValueChange={(value: ThemeMode) => updateSettings({ theme: value })}
          >
            <SelectTrigger id="theme-select" className="w-full">
              <div className="flex items-center gap-2">
                {getThemeIcon(settings.theme)}
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Auto (System)
                </div>
              </SelectItem>
              <SelectItem value="light">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Light
                </div>
              </SelectItem>
              <SelectItem value="dark">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4" />
                  Dark
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* High Contrast Toggle */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="contrast-toggle" className="text-sm font-medium">
              High Contrast
            </Label>
            <div className="text-xs text-fg-muted">
              Enhance text and element contrast
            </div>
          </div>
          <Switch
            id="contrast-toggle"
            checked={settings.contrast === 'high'}
            onCheckedChange={(checked) => updateSettings({ 
              contrast: checked ? 'high' : 'normal' 
            })}
            data-testid="switch-high-contrast"
          />
        </div>

        {/* Density Selection */}
        <div className="space-y-2">
          <Label htmlFor="density-select" className="text-sm font-medium">
            Density
          </Label>
          <Select 
            value={settings.density} 
            onValueChange={(value: DensityMode) => updateSettings({ density: value })}
          >
            <SelectTrigger id="density-select" className="w-full">
              <div className="flex items-center gap-2">
                {getDensityIcon(settings.density)}
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="comfortable">
                <div className="flex items-center gap-2">
                  <Maximize className="h-4 w-4" />
                  Comfortable
                </div>
              </SelectItem>
              <SelectItem value="compact">
                <div className="flex items-center gap-2">
                  <Minimize className="h-4 w-4" />
                  Compact
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}