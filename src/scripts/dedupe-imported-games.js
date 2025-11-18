#!/usr/bin/env node
import connectDB from '../../config/mongo.js';
import mongoose from 'mongoose';
import Game from '../models/Game.js';
import UserGame from '../models/UserGame.js';
import Review from '../models/Review.js';

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes('--apply');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? Number(limitArg.split('=')[1]) : undefined;

  console.log(`dedupe-imported-games starting (apply=${apply})`);
  await connectDB();

  // Find rawgId groups with more than one document
  const pipeline = [
    { $match: { rawgId: { $ne: null } } },
    { $group: { _id: '$rawgId', count: { $sum: 1 }, ids: { $push: '$_id' } } },
    { $match: { count: { $gt: 1 } } },
    { $sort: { count: -1 } }
  ];

  if (limit) pipeline.push({ $limit: limit });

  const groups = await Game.aggregate(pipeline).exec();
  console.log(`Found ${groups.length} rawgId groups with duplicates`);

  for (const g of groups) {
    const rawgId = g._id;
    const ids = g.ids.map(id => String(id));
    console.log('\n---\nProcessing rawgId=', rawgId, 'count=', ids.length);

    const docs = await Game.find({ _id: { $in: ids } }).sort({ createdAt: 1 }).lean().exec();
    // Choose keeper: prefer one with esJuegoImportado true and no ownerId; else prefer no ownerId; else earliest created
    let keeper = docs.find(d => d.esJuegoImportado && !d.ownerId) || docs.find(d => !d.ownerId) || docs[0];
    if (!keeper) {
      console.warn('No keeper found for group, skipping', rawgId);
      continue;
    }

    const keeperId = String(keeper._id);
    const duplicates = docs.filter(d => String(d._id) !== keeperId);

    // Count references
    const dupIds = duplicates.map(d => d._id);
    const usergameCounts = await UserGame.aggregate([
      { $match: { gameId: { $in: dupIds } } },
      { $group: { _id: '$gameId', count: { $sum: 1 } } }
    ]).exec();
    const reviewCounts = await Review.aggregate([
      { $match: { juegoId: { $in: dupIds } } },
      { $group: { _id: '$juegoId', count: { $sum: 1 } } }
    ]).exec();

    console.log('Keeper:', keeperId, keeper.titulo, keeper.ownerId ? `(owner:${keeper.ownerId})` : '(global)');
    console.log('Duplicates:', duplicates.map(d => `${d._id}${d.ownerId ? '(owner)' : ''}`).join(', '));
    console.log('UserGame refs:', JSON.stringify(usergameCounts));
    console.log('Review refs:', JSON.stringify(reviewCounts));

    if (!apply) {
      console.log('Dry run - no changes. Use --apply to perform migration.');
      continue;
    }

    // Apply: reassign references and delete duplicates
    for (const dup of duplicates) {
      const dupId = dup._id;
      console.log(`Reassigning references from ${dupId} -> ${keeperId}`);
      // Update usergames
      const ugRes = await UserGame.updateMany({ gameId: dupId }, { $set: { gameId: keeperId } }).exec();
      console.log(`  UserGame updated: ${ugRes.matchedCount || ugRes.nModified || ugRes.modifiedCount || 0}`);
      // Update reviews (juegoId)
      const revRes = await Review.updateMany({ juegoId: dupId }, { $set: { juegoId: keeperId } }).exec();
      console.log(`  Reviews updated: ${revRes.matchedCount || revRes.nModified || revRes.modifiedCount || 0}`);
      // Finally delete the duplicate Game
      const del = await Game.deleteOne({ _id: dupId }).exec();
      console.log(`  Game deleted: ${del.deletedCount || del.n || 0}`);
    }

    console.log(`Finished processing rawgId=${rawgId}`);
  }

  console.log('\nAll done.');
  process.exit(0);
}

main().catch(err => {
  console.error('Error in dedupe-imported-games:', err);
  process.exit(1);
});
