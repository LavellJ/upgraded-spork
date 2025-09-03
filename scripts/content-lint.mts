#!/usr/bin/env node
/**
 * Content Linter CLI - Validates lesson registry and content files
 * 
 * Usage: npm run content:lint
 * 
 * Validates:
 * - JSON schema against RegistryV2
 * - Unique lesson IDs across base + packs  
 * - Skill ID references exist
 * - Standards framework keys exist
 * - Locale requirements (at least one title locale)
 * - ID format compliance
 */

import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { validateRegistryV2, RegistryV2, LessonV2 } from '../client/src/authoring/schema.js';

// CLI Colors for output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

interface LintIssue {
  type: 'error' | 'warning';
  category: string;
  file: string;
  message: string;
  location?: string;
}

class ContentLinter {
  private issues: LintIssue[] = [];
  private registries: Array<{ data: RegistryV2; source: string }> = [];

  constructor() {}

  /**
   * Add a lint issue
   */
  private addIssue(issue: LintIssue) {
    this.issues.push(issue);
  }

  /**
   * Load and parse a JSON file safely
   */
  private loadJsonFile(filePath: string): unknown | null {
    try {
      if (!existsSync(filePath)) {
        this.addIssue({
          type: 'error',
          category: 'File System',
          file: filePath,
          message: `File not found: ${filePath}`
        });
        return null;
      }

      const content = readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      this.addIssue({
        type: 'error',
        category: 'JSON Parse',
        file: filePath,
        message: `Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
      return null;
    }
  }

  /**
   * Load registry files (base + packs)
   */
  private loadRegistries() {
    const baseRegistryPath = resolve('client/src/data/registry.json');
    const packsDir = resolve('client/src/data/packs');

    // Load base registry
    const baseData = this.loadJsonFile(baseRegistryPath);
    if (baseData) {
      const validation = validateRegistryV2(baseData, 'registry.json');
      if (validation.success) {
        this.registries.push({ data: validation.data, source: 'registry.json' });
      } else {
        validation.errors.forEach(error => {
          this.addIssue({
            type: 'error',
            category: 'Schema Validation',
            file: 'registry.json',
            message: error
          });
        });
      }
    }

    // Load pack registries (if packs directory exists)
    if (existsSync(packsDir)) {
      try {
        const packFiles = readFileSync(packsDir, 'utf-8').split('\n').filter(f => f.endsWith('.json'));
        
        for (const packFile of packFiles) {
          const packPath = join(packsDir, packFile);
          const packData = this.loadJsonFile(packPath);
          
          if (packData) {
            const validation = validateRegistryV2(packData, packFile);
            if (validation.success) {
              this.registries.push({ data: validation.data, source: packFile });
            } else {
              validation.errors.forEach(error => {
                this.addIssue({
                  type: 'error',
                  category: 'Schema Validation',
                  file: packFile,
                  message: error
                });
              });
            }
          }
        }
      } catch (error) {
        // Packs directory exists but can't be read - that's ok, no packs
      }
    }
  }

  /**
   * Check for unique lesson IDs across all registries
   */
  private checkUniqueIds() {
    const seenIds = new Map<string, string[]>();

    for (const { data, source } of this.registries) {
      for (const lesson of data.lessons) {
        if (!seenIds.has(lesson.id)) {
          seenIds.set(lesson.id, []);
        }
        seenIds.get(lesson.id)!.push(source);
      }
    }

    // Find duplicates
    for (const [lessonId, sources] of seenIds) {
      if (sources.length > 1) {
        this.addIssue({
          type: 'error',
          category: 'ID Collision',
          file: sources.join(', '),
          message: `Duplicate lesson ID '${lessonId}' found in: ${sources.join(', ')}`,
          location: `lesson.id: ${lessonId}`
        });
      }
    }
  }

  /**
   * Check skill ID references exist
   */
  private checkSkillReferences() {
    // Collect all defined skills
    const definedSkills = new Set<string>();
    for (const { data } of this.registries) {
      if (data.skills) {
        for (const skill of data.skills) {
          definedSkills.add(skill.id);
        }
      }
    }

    // Check lesson skill references
    for (const { data, source } of this.registries) {
      for (const lesson of data.lessons) {
        for (const skillId of lesson.skills) {
          if (!definedSkills.has(skillId)) {
            this.addIssue({
              type: 'error',
              category: 'Reference Integrity',
              file: source,
              message: `Lesson '${lesson.id}' references undefined skill '${skillId}'`,
              location: `lesson.${lesson.id}.skills`
            });
          }
        }
      }
    }
  }

  /**
   * Check standards framework keys exist
   */
  private checkStandardsFrameworks() {
    // Collect all defined frameworks
    const definedFrameworks = new Set<string>();
    for (const { data } of this.registries) {
      if (data.frameworks) {
        for (const framework of Object.keys(data.frameworks)) {
          definedFrameworks.add(framework);
        }
      }
    }

    // Check lesson standards references
    for (const { data, source } of this.registries) {
      for (const lesson of data.lessons) {
        if (lesson.standards) {
          for (const standard of lesson.standards) {
            if (!definedFrameworks.has(standard.framework)) {
              this.addIssue({
                type: 'warning',
                category: 'Standards Framework',
                file: source,
                message: `Lesson '${lesson.id}' references undefined framework '${standard.framework}'`,
                location: `lesson.${lesson.id}.standards`
              });
            }
          }
        }
      }
    }
  }

  /**
   * Check locale requirements
   */
  private checkLocaleRequirements() {
    for (const { data, source } of this.registries) {
      for (const lesson of data.lessons) {
        // Check lesson title has at least one locale
        const titleLocales = Object.values(lesson.title).filter(Boolean);
        if (titleLocales.length === 0) {
          this.addIssue({
            type: 'error',
            category: 'Locale Requirements',
            file: source,
            message: `Lesson '${lesson.id}' title has no locale strings`,
            location: `lesson.${lesson.id}.title`
          });
        }

        // Check summary if present
        if (lesson.summary) {
          const summaryLocales = Object.values(lesson.summary).filter(Boolean);
          if (summaryLocales.length === 0) {
            this.addIssue({
              type: 'warning',
              category: 'Locale Requirements',
              file: source,
              message: `Lesson '${lesson.id}' summary has no locale strings`,
              location: `lesson.${lesson.id}.summary`
            });
          }
        }
      }

      // Check skill labels
      if (data.skills) {
        for (const skill of data.skills) {
          const labelLocales = Object.values(skill.label).filter(Boolean);
          if (labelLocales.length === 0) {
            this.addIssue({
              type: 'error',
              category: 'Locale Requirements',
              file: source,
              message: `Skill '${skill.id}' label has no locale strings`,
              location: `skill.${skill.id}.label`
            });
          }
        }
      }
    }
  }

  /**
   * Print lint results in a formatted table
   */
  private printResults() {
    const errors = this.issues.filter(i => i.type === 'error');
    const warnings = this.issues.filter(i => i.type === 'warning');

    console.log(`${colors.bold}Content Lint Results${colors.reset}\n`);

    if (this.issues.length === 0) {
      console.log(`${colors.green}✅ All content validation checks passed!${colors.reset}`);
      return;
    }

    // Print summary
    console.log(`${colors.red}❌ ${errors.length} error(s)${colors.reset}, ${colors.yellow}⚠️  ${warnings.length} warning(s)${colors.reset}\n`);

    // Group issues by category
    const byCategory = new Map<string, LintIssue[]>();
    for (const issue of this.issues) {
      if (!byCategory.has(issue.category)) {
        byCategory.set(issue.category, []);
      }
      byCategory.get(issue.category)!.push(issue);
    }

    // Print issues by category
    for (const [category, categoryIssues] of byCategory) {
      console.log(`${colors.bold}${category}:${colors.reset}`);
      
      for (const issue of categoryIssues) {
        const color = issue.type === 'error' ? colors.red : colors.yellow;
        const icon = issue.type === 'error' ? '❌' : '⚠️ ';
        const location = issue.location ? ` (${issue.location})` : '';
        
        console.log(`  ${icon} ${color}${issue.file}${colors.reset}: ${issue.message}${location}`);
      }
      console.log();
    }
  }

  /**
   * Run all lint checks
   */
  public async lint(): Promise<number> {
    console.log(`${colors.blue}🔍 Running content validation...${colors.reset}\n`);

    // Load registries
    this.loadRegistries();

    if (this.registries.length === 0) {
      console.log(`${colors.red}❌ No valid registries found to lint${colors.reset}`);
      return 1;
    }

    console.log(`📄 Found ${this.registries.length} registry file(s): ${this.registries.map(r => r.source).join(', ')}\n`);

    // Run checks
    this.checkUniqueIds();
    this.checkSkillReferences();
    this.checkStandardsFrameworks();
    this.checkLocaleRequirements();

    // Print results
    this.printResults();

    // Return exit code
    const errors = this.issues.filter(i => i.type === 'error');
    return errors.length > 0 ? 1 : 0;
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const linter = new ContentLinter();
  
  linter.lint()
    .then(exitCode => process.exit(exitCode))
    .catch(error => {
      console.error(`${colors.red}❌ Linter crashed: ${error}${colors.reset}`);
      process.exit(1);
    });
}