/**
 * Locale Toggle Component
 * 
 * Provides a segmented control for switching between supported locales.
 * Integrates with the locale system and content pack management.
 */

import React from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Globe } from 'lucide-react';
import { getLocale, setLocale, onLocaleChange, getLocaleInfo, SUPPORTED_LOCALES } from '../i18n/locale';
import { enablePacksByLocale } from '../authoring/packs';
import type { Locale } from '../authoring/schema';

interface LocaleToggleProps {
  className?: string;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'buttons' | 'pills' | 'compact';
}

export function LocaleToggle({ 
  className = '', 
  showLabels = true, 
  size = 'md',
  variant = 'buttons'
}: LocaleToggleProps) {
  const [currentLocale, setCurrentLocale] = React.useState<Locale>(getLocale());
  const [isChanging, setIsChanging] = React.useState(false);

  // Listen for locale changes from other components
  React.useEffect(() => {
    const unsubscribe = onLocaleChange((newLocale) => {
      setCurrentLocale(newLocale);
    });
    
    return unsubscribe;
  }, []);

  const handleLocaleChange = async (newLocale: Locale) => {
    if (newLocale === currentLocale || isChanging) {
      return;
    }

    try {
      setIsChanging(true);
      
      // Update the locale system
      setLocale(newLocale);
      
      // Enable content packs for the new locale
      enablePacksByLocale(newLocale);
      
      // Update local state
      setCurrentLocale(newLocale);
      
    } catch (error) {
      console.error('Failed to change locale:', error);
    } finally {
      setIsChanging(false);
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'sm': return 'sm';
      case 'lg': return 'lg';
      case 'md':
      default: return 'default';
    }
  };

  const getButtonContent = (locale: Locale) => {
    const info = getLocaleInfo(locale);
    
    if (variant === 'compact') {
      return (
        <span className="flex items-center gap-1">
          {info.flag}
          <span className="hidden sm:inline">{locale}</span>
        </span>
      );
    }
    
    return (
      <span className="flex items-center gap-2">
        <span className="text-lg">{info.flag}</span>
        {showLabels && (
          <span className="hidden sm:inline text-sm">
            {locale === 'en-AU' ? 'Australian' :
             locale === 'en-US' ? 'American' :
             'British'}
          </span>
        )}
      </span>
    );
  };

  if (variant === 'pills') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {SUPPORTED_LOCALES.map((locale) => {
          const isActive = locale === currentLocale;
          const info = getLocaleInfo(locale);
          
          return (
            <Badge
              key={locale}
              variant={isActive ? 'default' : 'outline'}
              className={`cursor-pointer transition-all ${
                isActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'
              } ${isChanging ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => handleLocaleChange(locale)}
              data-testid={`locale-pill-${locale}`}
            >
              <span className="flex items-center gap-1">
                {info.flag}
                <span className="text-xs">{locale}</span>
              </span>
            </Badge>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {variant !== 'compact' && (
        <Globe className="h-4 w-4 text-gray-500 mr-1" />
      )}
      
      <div className="flex rounded-md overflow-hidden border border-gray-200">
        {SUPPORTED_LOCALES.map((locale, index) => {
          const isActive = locale === currentLocale;
          const isFirst = index === 0;
          const isLast = index === SUPPORTED_LOCALES.length - 1;
          
          return (
            <Button
              key={locale}
              variant={isActive ? 'default' : 'ghost'}
              size={getButtonSize()}
              onClick={() => handleLocaleChange(locale)}
              disabled={isChanging}
              className={`
                ${!isFirst ? 'border-l-0' : ''} 
                ${isLast ? 'rounded-r-md' : 'rounded-r-none'} 
                ${isFirst ? 'rounded-l-md' : 'rounded-l-none'}
                ${isActive ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-200 hover:bg-gray-50'}
                transition-all duration-200
                ${isChanging ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              data-testid={`locale-button-${locale}`}
            >
              {getButtonContent(locale)}
            </Button>
          );
        })}
      </div>
      
      {isChanging && (
        <div className="ml-2 text-xs text-gray-500">
          Switching...
        </div>
      )}
    </div>
  );
}

/**
 * Compact locale indicator (read-only display)
 */
export function LocaleIndicator({ className = '' }: { className?: string }) {
  const [currentLocale, setCurrentLocale] = React.useState<Locale>(getLocale());
  
  React.useEffect(() => {
    const unsubscribe = onLocaleChange((newLocale) => {
      setCurrentLocale(newLocale);
    });
    
    return unsubscribe;
  }, []);
  
  const info = getLocaleInfo(currentLocale);
  
  return (
    <Badge variant="outline" className={`${className}`} data-testid="locale-indicator">
      <span className="flex items-center gap-1">
        {info.flag}
        <span className="text-xs">{currentLocale}</span>
      </span>
    </Badge>
  );
}