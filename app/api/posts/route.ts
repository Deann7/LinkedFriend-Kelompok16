import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '../../../utils/mongodb';
import Post from '../../../models/Post';
import User from '../../../models/User'; // Ensure User schema is registered
import { verifyToken } from '../../../utils/auth';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  await dbConnect();
  // Ensure User model is registered with mongoose (fix for HMR/Next.js)
  if (!mongoose.models.User) {
    mongoose.model('User', User.schema);
  }
  
  const url = new URL(req.url);
  const ids = url.searchParams.getAll('ids');
  const sortBy = url.searchParams.get('sortBy') || 'date'; // Default sort by date
  const sortOrder = url.searchParams.get('order') || 'desc'; // Default descending order
  
  // Complex sorting algorithm using MongoDB aggregation pipeline
  // This provides optimized performance for large datasets
  
  let matchStage: any = {};
  if (ids && ids.length > 0) {
    matchStage = { author: { $in: ids.map(id => new mongoose.Types.ObjectId(id)) } };
  }
  
  // Build advanced sorting pipeline based on sortBy and sortOrder parameters
  const pipeline = [
    { $match: matchStage },
    // Add a computed field for likes count to enable efficient sorting
    { $addFields: {
        likesCount: { $size: { $ifNull: ["$likes", []] } }
    }},
    // Lookup author details
    { $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'authorDetails'
    }},
    // Unwind the author array
    { $unwind: '$authorDetails' },
    // Project only needed fields and reshape for response
    { $project: {
        _id: 1,
        content: 1,
        image: 1,
        likes: 1,
        likesCount: 1,
        createdAt: 1,
        updatedAt: 1,
        author: {
          _id: '$authorDetails._id',
          firstName: '$authorDetails.firstName',
          lastName: '$authorDetails.lastName',
          jobTitle: '$authorDetails.jobTitle',
          location: '$authorDetails.location',
          email: '$authorDetails.email'
        }
    }}
  ];
  // Add sort stage based on user preferences
  let sortStage: any;
  if (sortBy === 'likes') {
    sortStage = { $sort: { 
      likesCount: sortOrder === 'asc' ? 1 : -1,
      createdAt: -1 // Secondary sort by date (newest first)
    }};
  } else { // sortBy === 'date'
    sortStage = { $sort: { 
      createdAt: sortOrder === 'asc' ? 1 : -1,
      likesCount: -1 // Secondary sort by likes (most liked first)
    }};
  }
  
  pipeline.push(sortStage);
  
  // Execute the aggregation pipeline
  const posts = await Post.aggregate(pipeline).exec();
  
  return NextResponse.json(posts);
}

export async function POST(req: NextRequest) {
  await dbConnect();
  const verify = verifyToken(req);
  if (!verify.success || !verify.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { content, image } = await req.json();
  const post = await Post.create({ author: verify.userId, content, image });
  return NextResponse.json(post, { status: 201 });
}
