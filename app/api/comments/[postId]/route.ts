import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/utils/mongodb';
import Comment from '@/models/Comment';

export async function GET(req: NextRequest, context: { params: { postId: string } }) {
  await dbConnect;

  const postId = context.params.postId;

  try {
    const comments = await Comment.find({ postId }).populate('userId', 'firstName lastName image');
    return NextResponse.json(comments);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}