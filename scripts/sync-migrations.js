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
import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

const MIGRATIONS_DIR = 'supabase/migrations';
const MIGRATION_PATTERN = /^\d{14}_.*\.sql$/;

/**
 * Load environment variables from .env file
 */
function loadEnv() {
  const envPath = join(process.cwd(), '.env');
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf8');
    const lines = envContent.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').trim();
        if (key && value) {
          process.env[key.trim()] = value;
        }
      }
    }
  }
}

// Load .env before doing anything else
loadEnv();

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
    console.warn('⚠️  Supabase CLI not available - skipping migration sync');
    return false;
  }
  
  // Check if project is linked
  const projectRefPath = join(MIGRATIONS_DIR, '..', '.temp', 'project-ref');
  if (!existsSync(projectRefPath)) {
    console.warn('⚠️  Supabase project not linked - skipping migration sync');
    console.warn('   Run: npx supabase link --project-ref ptigdekgzraimaepgczt');
    return false;
  }
  
  console.log('✅ Supabase CLI ready');
  return true;
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
    console.warn('⚠️  Failed to get migration status - skipping sync check');
    return { success: false, hasLocalOnly: false };
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
  
  return { success: true, hasLocalOnly };
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
  const isSetup = checkSupabaseSetup();
  
  if (!isSetup) {
    console.log('⚠️  Supabase not configured - allowing commit without sync');
    console.log('━'.repeat(50));
    console.log('✅ Commit allowed (manual migration sync required)\n');
    process.exit(0);
  }
  
  // Get migration files
  const migrations = getMigrationFiles();
  
  if (migrations.length === 0) {
    console.log('✅ No migrations to sync');
    process.exit(0);
  }
  
  console.log(`📁 Found ${migrations.length} migration file(s)`);
  
  // Check if there are local-only migrations
  const { success, hasLocalOnly } = checkMigrationStatus();
  
  if (!success) {
    console.log('⚠️  Cannot verify migration status - allowing commit');
    console.log('   Please manually run: npx supabase db push');
    console.log('━'.repeat(50));
    console.log('✅ Commit allowed (manual verification required)\n');
    process.exit(0);
  }
  
  if (!hasLocalOnly) {
    console.log('✅ All migrations are synced with remote');
    console.log('━'.repeat(50));
    process.exit(0);
  }
  
  console.log('⚠️  Found local-only migrations that need to be pushed');
  
  // Push migrations to Supabase
  const pushSuccess = pushMigrations();
  
  console.log('━'.repeat(50));
  
  if (pushSuccess) {
    console.log('✅ Ready to commit!\n');
    process.exit(0);
  } else {
    console.log('❌ Cannot commit until migrations are synced\n');
    process.exit(1);
  }
}

// Run the script
main();
