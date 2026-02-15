#!/usr/bin/env node

/**
 * Sync Migrations Script
 * 
 * Automatically checks and pushes new migrations to Supabase
 * before allowing git commit to proceed.
 * 
 * This ensures zero divergence between local and remote migrations.
 */

import { execSync } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { join } from 'path';

const MIGRATIONS_DIR = 'supabase/migrations';
const MIGRATION_PATTERN = /^\d{14}_.*\.sql$/;

/**
 * Execute shell command and return output
 */
function exec(command, options = {}) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: 'pipe',
      ...options
    });
  } catch (error) {
    return null;
  }
}

/**
 * Check if Supabase CLI is available and project is linked
 */
function checkSupabaseSetup() {
  console.log('🔍 Checking Supabase setup...');
  
  // Check if CLI is available
  const version = exec('npx supabase --version');
  if (!version) {
    console.error('❌ Supabase CLI not available');
    console.error('   Run: npx supabase init');
    process.exit(1);
  }
  
  // Check if project is linked
  const projectRefPath = join(MIGRATIONS_DIR, '..', '.temp', 'project-ref');
  if (!existsSync(projectRefPath)) {
    console.error('❌ Supabase project not linked');
    console.error('   Run: npx supabase link --project-ref ptigdekgzraimaepgczt');
    process.exit(1);
  }
  
  console.log('✅ Supabase CLI ready');
}

/**
 * Get list of migration files that need to be synced
 */
function getMigrationFiles() {
  if (!existsSync(MIGRATIONS_DIR)) {
    console.log('ℹ️  No migrations directory found');
    return [];
  }
  
  const files = readdirSync(MIGRATIONS_DIR);
  return files.filter(file => MIGRATION_PATTERN.test(file));
}

/**
 * Check if migrations are in sync with remote
 */
function checkMigrationStatus() {
  console.log('\n📋 Checking migration status...');
  
  const output = exec('npx supabase migration list', { stdio: 'pipe' });
  if (!output) {
    console.error('❌ Failed to get migration status');
    process.exit(1);
  }
  
  // Parse output to check for local-only migrations
  const lines = output.split('\n');
  const hasLocalOnly = lines.some(line => {
    const parts = line.trim().split('|');
    if (parts.length < 3) return false;
    const local = parts[0].trim();
    const remote = parts[1].trim();
    return local && !remote;
  });
  
  return hasLocalOnly;
}

/**
 * Push migrations to Supabase
 */
function pushMigrations() {
  console.log('\n🚀 Pushing migrations to Supabase...');
  
  try {
    // First do a dry run to see what would be pushed
    const dryRun = exec('npx supabase db push --dry-run', { stdio: 'pipe' });
    
    if (dryRun && dryRun.includes('Would push these migrations:')) {
      console.log('\n📦 Migrations to be applied:');
      const lines = dryRun.split('\n');
      lines.forEach(line => {
        if (line.includes('•')) {
          console.log('   ' + line.trim());
        }
      });
      console.log('');
    } else if (dryRun && dryRun.includes('Remote database is up to date')) {
      console.log('✅ All migrations already applied');
      return true;
    }
    
    // Actually push the migrations
    const result = execSync('npx supabase db push', {
      encoding: 'utf8',
      stdio: 'inherit'
    });
    
    console.log('\n✅ Migrations successfully pushed to Supabase');
    return true;
    
  } catch (error) {
    console.error('\n❌ Failed to push migrations');
    console.error('   Error:', error.message);
    console.error('\n   Please fix the migration errors before committing');
    return false;
  }
}

/**
 * Main execution
 */
function main() {
  console.log('\n🔄 Migration Sync Hook');
  console.log('━'.repeat(50));
  
  // Check if Supabase is set up
  checkSupabaseSetup();
  
  // Get migration files
  const migrations = getMigrationFiles();
  
  if (migrations.length === 0) {
    console.log('✅ No migrations to sync');
    process.exit(0);
  }
  
  console.log(`📁 Found ${migrations.length} migration file(s)`);
  
  // Check if there are local-only migrations
  const hasLocalOnly = checkMigrationStatus();
  
  if (!hasLocalOnly) {
    console.log('✅ All migrations are synced with remote');
    console.log('━'.repeat(50));
    process.exit(0);
  }
  
  console.log('⚠️  Found local-only migrations that need to be pushed');
  
  // Push migrations to Supabase
  const success = pushMigrations();
  
  console.log('━'.repeat(50));
  
  if (success) {
    console.log('✅ Ready to commit!\n');
    process.exit(0);
  } else {
    console.log('❌ Cannot commit until migrations are synced\n');
    process.exit(1);
  }
}

// Run the script
main();
