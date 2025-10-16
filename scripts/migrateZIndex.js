/**
 * Firestore Migration Script: Add zIndex to existing shapes
 * 
 * This script adds zIndex property to all shapes that don't have one.
 * zIndex is set based on createdAt timestamp to preserve creation order.
 * 
 * Usage:
 *   node scripts/migrateZIndex.js
 * 
 * Environment:
 *   Requires Firebase Admin SDK credentials in GOOGLE_APPLICATION_CREDENTIALS
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Firebase Admin
const serviceAccount = JSON.parse(
  readFileSync(join(__dirname, '../firebase-service-account.json'), 'utf8')
);

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

/**
 * Migrate a single board's shapes
 */
async function migrateBoardShapes(boardId) {
  console.log(`\n🔍 Migrating board: ${boardId}`);
  
  const shapesRef = db.collection('boards').doc(boardId).collection('shapes');
  const snapshot = await shapesRef.get();
  
  if (snapshot.empty) {
    console.log(`  ℹ️  No shapes found in board ${boardId}`);
    return { total: 0, updated: 0, errors: 0 };
  }
  
  const shapes = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    shapes.push({
      id: doc.id,
      ref: doc.ref,
      data,
      hasZIndex: data.props?.zIndex !== undefined,
      createdAt: data.createdAt?.toMillis() || Date.now(),
    });
  });
  
  console.log(`  📊 Found ${shapes.length} shapes`);
  
  // Filter shapes that need zIndex
  const shapesNeedingZIndex = shapes.filter(s => !s.hasZIndex);
  console.log(`  ✏️  ${shapesNeedingZIndex.length} shapes need zIndex`);
  
  if (shapesNeedingZIndex.length === 0) {
    return { total: shapes.length, updated: 0, errors: 0 };
  }
  
  // Sort by createdAt to assign zIndex in creation order
  shapesNeedingZIndex.sort((a, b) => a.createdAt - b.createdAt);
  
  // Find max existing zIndex to avoid conflicts
  const existingMaxZ = Math.max(
    0,
    ...shapes
      .filter(s => s.hasZIndex)
      .map(s => s.data.props.zIndex ?? 0)
  );
  
  let updated = 0;
  let errors = 0;
  
  // Batch updates (Firestore limit: 500 operations per batch)
  const BATCH_SIZE = 500;
  const batches = [];
  
  for (let i = 0; i < shapesNeedingZIndex.length; i += BATCH_SIZE) {
    batches.push(shapesNeedingZIndex.slice(i, i + BATCH_SIZE));
  }
  
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = db.batch();
    const batchShapes = batches[batchIndex];
    
    console.log(`  📦 Processing batch ${batchIndex + 1}/${batches.length} (${batchShapes.length} shapes)`);
    
    batchShapes.forEach((shape, index) => {
      // Assign zIndex starting from existingMaxZ + 1
      const newZIndex = existingMaxZ + (batchIndex * BATCH_SIZE) + index + 1;
      
      batch.update(shape.ref, {
        'props.zIndex': newZIndex,
        updatedAt: new Date(),
      });
    });
    
    try {
      await batch.commit();
      updated += batchShapes.length;
      console.log(`  ✅ Batch ${batchIndex + 1} committed successfully`);
    } catch (error) {
      errors += batchShapes.length;
      console.error(`  ❌ Batch ${batchIndex + 1} failed:`, error.message);
    }
  }
  
  return { total: shapes.length, updated, errors };
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('🚀 Starting zIndex migration...\n');
  
  try {
    // Get all boards
    const boardsSnapshot = await db.collection('boards').get();
    
    if (boardsSnapshot.empty) {
      console.log('ℹ️  No boards found');
      return;
    }
    
    console.log(`📋 Found ${boardsSnapshot.size} board(s)\n`);
    
    const results = [];
    
    for (const boardDoc of boardsSnapshot.docs) {
      const result = await migrateBoardShapes(boardDoc.id);
      results.push({ boardId: boardDoc.id, ...result });
    }
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📈 Migration Summary');
    console.log('='.repeat(60));
    
    const totals = results.reduce(
      (acc, r) => ({
        total: acc.total + r.total,
        updated: acc.updated + r.updated,
        errors: acc.errors + r.errors,
      }),
      { total: 0, updated: 0, errors: 0 }
    );
    
    results.forEach(r => {
      console.log(`\n  Board: ${r.boardId}`);
      console.log(`    Total shapes: ${r.total}`);
      console.log(`    Updated: ${r.updated}`);
      console.log(`    Errors: ${r.errors}`);
    });
    
    console.log('\n' + '-'.repeat(60));
    console.log(`  Total shapes: ${totals.total}`);
    console.log(`  Total updated: ${totals.updated}`);
    console.log(`  Total errors: ${totals.errors}`);
    console.log('='.repeat(60));
    
    if (totals.errors === 0) {
      console.log('\n✨ Migration completed successfully!');
    } else {
      console.log(`\n⚠️  Migration completed with ${totals.errors} errors`);
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
migrate()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

