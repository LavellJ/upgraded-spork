import React from 'react';
import { ChevronRight, MoreVertical } from 'lucide-react';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { cn } from '../../lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface PageAction {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost';
  disabled?: boolean;
}

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: PageAction[];
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  breadcrumbs = [],
  actions = [],
  className
}: PageHeaderProps) {
  const handleBreadcrumbClick = (item: BreadcrumbItem, event: React.MouseEvent) => {
    if (item.onClick) {
      event.preventDefault();
      item.onClick();
    }
  };

  return (
    <div className={cn("py-4", className)}>
      {/* Breadcrumbs */}
      {breadcrumbs.length > 0 && (
        <nav className="mb-2" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-fg-muted">
            {breadcrumbs.map((item, index) => (
              <li key={index} className="flex items-center">
                {index > 0 && (
                  <ChevronRight className="h-4 w-4 mx-2" aria-hidden="true" />
                )}
                {item.href || item.onClick ? (
                  item.href ? (
                    <a
                      href={item.href}
                      className="hover:text-fg-default transition-colors"
                      onClick={(e) => handleBreadcrumbClick(item, e)}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="hover:text-fg-default transition-colors"
                      onClick={item.onClick}
                    >
                      {item.label}
                    </button>
                  )
                ) : (
                  <span className={index === breadcrumbs.length - 1 ? 'text-fg-default' : ''}>
                    {item.label}
                  </span>
                )}
              </li>
            ))}
          </ol>
        </nav>
      )}

      {/* Header content */}
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h1 className="page-title text-fg-default">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 subtle">
              {subtitle}
            </p>
          )}
        </div>

        {/* Actions */}
        {actions.length > 0 && (
          <div className="flex items-center gap-2 ml-4">
            {/* Desktop: Show first 3 actions, rest in dropdown */}
            <div className="hidden sm:flex items-center gap-2">
              {actions.slice(0, 3).map((action, index) => {
                const Icon = action.icon;
                return (
                  <Button
                    key={index}
                    variant={action.variant || 'outline'}
                    size="sm"
                    onClick={action.onClick}
                    disabled={action.disabled}
                    data-testid={`button-${action.label.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {Icon && <Icon className="h-4 w-4 mr-1" />}
                    {action.label}
                  </Button>
                );
              })}
              
              {/* Overflow dropdown for desktop */}
              {actions.length > 3 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" data-testid="button-more-actions">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {actions.slice(3).map((action, index) => {
                      const Icon = action.icon;
                      return (
                        <DropdownMenuItem
                          key={index + 3}
                          onClick={action.onClick}
                          disabled={action.disabled}
                        >
                          {Icon && <Icon className="h-4 w-4 mr-2" />}
                          {action.label}
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Mobile: All actions in kebab menu */}
            <div className="sm:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" data-testid="button-mobile-menu">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {actions.map((action, index) => {
                    const Icon = action.icon;
                    return (
                      <DropdownMenuItem
                        key={index}
                        onClick={action.onClick}
                        disabled={action.disabled}
                      >
                        {Icon && <Icon className="h-4 w-4 mr-2" />}
                        {action.label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}