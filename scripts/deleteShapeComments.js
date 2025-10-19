/**
 * Data Migration Script: Delete Shape-Level Comments
 * 
 * This script deletes all shape-level comments from Firestore
 * as part of the migration to a global board-level comments system.
 * 
 * Usage:
 *   node scripts/deleteShapeComments.js
 * 
 * Requires:
 *   - FIREBASE_SERVICE_ACCOUNT_PATH env variable pointing to your service account JSON
 *   - Or configure Firebase Admin SDK manually
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  
  if (serviceAccountPath) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    // Fallback to default credentials (works in Cloud Functions)
    admin.initializeApp();
  }
}

const db = admin.firestore();

async function deleteShapeComments() {
  console.log('Starting shape comments deletion...\n');
  
  let totalDeleted = 0;
  
  try {
    // Get all boards
    const boardsSnapshot = await db.collection('boards').get();
    
    if (boardsSnapshot.empty) {
      console.log('No boards found.');
      return;
    }
    
    console.log(`Found ${boardsSnapshot.size} board(s)\n`);
    
    // For each board
    for (const boardDoc of boardsSnapshot.docs) {
      const boardId = boardDoc.id;
      console.log(`Processing board: ${boardId}`);
      
      // Get all shapes in this board
      const shapesSnapshot = await db
        .collection('boards')
        .doc(boardId)
        .collection('shapes')
        .get();
      
      if (shapesSnapshot.empty) {
        console.log(`  No shapes found in board ${boardId}`);
        continue;
      }
      
      console.log(`  Found ${shapesSnapshot.size} shape(s)`);
      
      let boardDeletedCount = 0;
      
      // For each shape
      for (const shapeDoc of shapesSnapshot.docs) {
        const shapeId = shapeDoc.id;
        
        // Get all comments for this shape
        const commentsSnapshot = await db
          .collection('boards')
          .doc(boardId)
          .collection('shapes')
          .doc(shapeId)
          .collection('comments')
          .get();
        
        if (!commentsSnapshot.empty) {
          console.log(`    Shape ${shapeId}: deleting ${commentsSnapshot.size} comment(s)`);
          
          // Delete each comment
          const batch = db.batch();
          commentsSnapshot.docs.forEach(commentDoc => {
            batch.delete(commentDoc.ref);
          });
          
          await batch.commit();
          boardDeletedCount += commentsSnapshot.size;
        }
      }
      
      if (boardDeletedCount > 0) {
        console.log(`  Deleted ${boardDeletedCount} comment(s) from board ${boardId}\n`);
        totalDeleted += boardDeletedCount;
      } else {
        console.log(`  No comments to delete in board ${boardId}\n`);
      }
    }
    
    console.log(`\n✅ Migration complete! Deleted ${totalDeleted} shape-level comment(s) total.`);
    
  } catch (error) {
    console.error('❌ Error during migration:', error);
    throw error;
  }
}

// Run the migration
deleteShapeComments()
  .then(() => {
    console.log('\nExiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nMigration failed:', error);
    process.exit(1);
  });

