#!/usr/bin/env node
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { gzipSync } from 'zlib';

// Bundle size budgets
const BUDGETS = {
  maxChunkSize: 250 * 1024, // 250KB gzipped per chunk
  maxTotalSize: 1.2 * 1024 * 1024, // 1.2MB gzipped total
};

function getGzippedSize(filePath) {
  try {
    const content = readFileSync(filePath);
    const gzipped = gzipSync(content);
    return gzipped.length;
  } catch (error) {
    console.warn(`Warning: Could not read ${filePath}:`, error.message);
    return 0;
  }
}

function formatSize(bytes) {
  const kb = bytes / 1024;
  return `${kb.toFixed(1)}KB`;
}

function checkBundleSize() {
  const distPath = './dist';
  const assetsPath = join(distPath, 'public', 'assets');
  
  console.log('🔍 Checking bundle sizes...\n');
  
  let jsFiles;
  try {
    jsFiles = readdirSync(assetsPath).filter(file => file.endsWith('.js'));
  } catch (error) {
    console.error('❌ Error: dist/public/assets directory not found. Please run build first.');
    process.exit(1);
  }
  
  if (jsFiles.length === 0) {
    console.error('❌ Error: No JavaScript files found in dist/assets/');
    process.exit(1);
  }
  
  let totalSize = 0;
  let hasErrors = false;
  const results = [];
  
  // Check each JS file
  for (const file of jsFiles) {
    const filePath = join(assetsPath, file);
    const originalSize = readFileSync(filePath).length;
    const gzippedSize = getGzippedSize(filePath);
    
    totalSize += gzippedSize;
    
    const isOverBudget = gzippedSize > BUDGETS.maxChunkSize;
    if (isOverBudget) {
      hasErrors = true;
    }
    
    results.push({
      file,
      originalSize,
      gzippedSize,
      isOverBudget
    });
  }
  
  // Display results
  console.log('📦 Bundle Analysis:');
  console.log('==================');
  
  for (const result of results) {
    const status = result.isOverBudget ? '❌' : '✅';
    const budget = `(budget: ${formatSize(BUDGETS.maxChunkSize)})`;
    
    console.log(`${status} ${result.file}`);
    console.log(`   Original: ${formatSize(result.originalSize)}`);
    console.log(`   Gzipped:  ${formatSize(result.gzippedSize)} ${budget}`);
    
    if (result.isOverBudget) {
      const overage = result.gzippedSize - BUDGETS.maxChunkSize;
      console.log(`   ⚠️  Over budget by ${formatSize(overage)}`);
    }
    console.log('');
  }
  
  // Check total size
  const totalOverBudget = totalSize > BUDGETS.maxTotalSize;
  if (totalOverBudget) {
    hasErrors = true;
  }
  
  console.log('📊 Total Bundle Size:');
  console.log('====================');
  const totalStatus = totalOverBudget ? '❌' : '✅';
  console.log(`${totalStatus} Total gzipped: ${formatSize(totalSize)} (budget: ${formatSize(BUDGETS.maxTotalSize)})`);
  
  if (totalOverBudget) {
    const overage = totalSize - BUDGETS.maxTotalSize;
    console.log(`⚠️  Over total budget by ${formatSize(overage)}`);
  }
  
  // Summary
  console.log('\n' + '='.repeat(50));
  
  if (hasErrors) {
    console.log('❌ BUNDLE SIZE CHECK FAILED');
    console.log('\n💡 Tips to reduce bundle size:');
    console.log('• Use dynamic imports for large dependencies');
    console.log('• Enable tree-shaking for unused code');
    console.log('• Consider code splitting for route-based chunks');
    console.log('• Review and minimize heavy dependencies');
    console.log('• Use lazy loading for non-critical components');
    process.exit(1);
  } else {
    console.log('✅ BUNDLE SIZE CHECK PASSED');
    console.log('All chunks are within the performance budget!');
  }
}

checkBundleSize();