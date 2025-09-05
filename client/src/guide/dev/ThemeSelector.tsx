import React from 'react'
import { useFlags } from '../../config/flags'
import { useTheme, type Theme } from '../../theme/useTheme'
import { Card } from '../../ui2/Card'

export function ThemeSelector() {
  const { teacherThemeV2 } = useFlags()
  const { theme, setTheme, themes } = useTheme()

  if (!teacherThemeV2) {
    return null
  }

  return (
    <Card className="p-4">
      <h3 className="text-lg font-medium mb-3">Theme Selection</h3>
      <div className="space-y-2">
        {themes.map(({ value, label }) => (
          <label key={value} className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="theme"
              value={value}
              checked={theme === value}
              onChange={() => setTheme(value as Theme)}
              className="text-brand-500 focus:ring-brand-500"
            />
            <span className="text-sm">{label}</span>
            {value === 'parchment' && <span className="text-xs text-fg-muted">(default)</span>}
          </label>
        ))}
      </div>
    </Card>
  )
}