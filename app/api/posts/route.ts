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
  let filter: any = {};
  if (ids && ids.length > 0) {
    filter = { author: { $in: ids } };
  }
  // Ambil SEMUA post dari semua author (bukan hanya 1 post per author)
  const posts = await Post.find(filter)
    .populate('author', 'firstName lastName jobTitle location email')
    .sort({ createdAt: -1 })
    .lean();
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
