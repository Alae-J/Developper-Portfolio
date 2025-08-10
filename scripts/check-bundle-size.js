#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getFileSize(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    return 0;
  }
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function parseSize(sizeString) {
  const match = sizeString.match(/^(\d+(?:\.\d+)?)(kb|mb|gb)$/i);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  
  switch (unit) {
    case 'kb': return value * 1024;
    case 'mb': return value * 1024 * 1024;
    case 'gb': return value * 1024 * 1024 * 1024;
    default: return value;
  }
}

function checkBundleSizes() {
  const budgetPath = path.join(__dirname, '..', 'performance-budget.json');
  const distPath = path.join(__dirname, '..', 'dist');
  
  if (!fs.existsSync(budgetPath)) {
    console.error('❌ Performance budget file not found');
    process.exit(1);
  }
  
  if (!fs.existsSync(distPath)) {
    console.error('❌ Build directory not found. Run "npm run build" first.');
    process.exit(1);
  }
  
  const budget = JSON.parse(fs.readFileSync(budgetPath, 'utf8'));
  const assetsPath = path.join(distPath, 'assets');
  
  if (!fs.existsSync(assetsPath)) {
    console.error('❌ Assets directory not found in build');
    process.exit(1);
  }
  
  const files = fs.readdirSync(assetsPath);
  const bundles = {
    main: files.filter(f => f.startsWith('index-') && f.endsWith('.js')),
    vendor: files.filter(f => f.includes('vendor') && f.endsWith('.js')),
    three: files.filter(f => f.includes('three') && f.endsWith('.js')),
    'react-three': files.filter(f => f.includes('react-three') && f.endsWith('.js'))
  };
  
  let hasErrors = false;
  let hasWarnings = false;
  
  console.log('🔍 Checking bundle sizes against performance budget...\n');
  
  budget.budget.forEach(budgetItem => {
    if (budgetItem.type === 'bundle') {
      const bundleFiles = bundles[budgetItem.name] || [];
      const totalSize = bundleFiles.reduce((sum, file) => {
        return sum + getFileSize(path.join(assetsPath, file));
      }, 0);
      
      const warningSize = parseSize(budgetItem.maximumWarning);
      const errorSize = parseSize(budgetItem.maximumError);
      
      let status = '✅';
      if (totalSize > errorSize) {
        status = '❌';
        hasErrors = true;
      } else if (totalSize > warningSize) {
        status = '⚠️';
        hasWarnings = true;
      }
      
      console.log(`${status} ${budgetItem.name}: ${formatSize(totalSize)} (limit: ${budgetItem.maximumWarning}/${budgetItem.maximumError})`);
      
      if (bundleFiles.length > 0) {
        bundleFiles.forEach(file => {
          const size = getFileSize(path.join(assetsPath, file));
          console.log(`   📄 ${file}: ${formatSize(size)}`);
        });
      }
      console.log();
    }
  });
  
  // Check total bundle size
  const totalBundleSize = Object.values(bundles).flat().reduce((sum, file) => {
    return sum + getFileSize(path.join(assetsPath, file));
  }, 0);
  
  const totalBudget = budget.budget.find(b => b.type === 'total');
  if (totalBudget) {
    const warningSize = parseSize(totalBudget.maximumWarning);
    const errorSize = parseSize(totalBudget.maximumError);
    
    let status = '✅';
    if (totalBundleSize > errorSize) {
      status = '❌';
      hasErrors = true;
    } else if (totalBundleSize > warningSize) {
      status = '⚠️';
      hasWarnings = true;
    }
    
    console.log(`${status} Total bundle size: ${formatSize(totalBundleSize)} (limit: ${totalBudget.maximumWarning}/${totalBudget.maximumError})\n`);
  }
  
  if (hasErrors) {
    console.log('❌ Bundle size check failed! Some bundles exceed error thresholds.');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  Bundle size check completed with warnings.');
    process.exit(0);
  } else {
    console.log('✅ All bundle sizes are within budget!');
    process.exit(0);
  }
}

checkBundleSizes();