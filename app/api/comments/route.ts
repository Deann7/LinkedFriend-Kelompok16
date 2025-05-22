import { NextResponse } from 'next/server';
import dbConnect from '@/utils/mongodb';
import Comment from '@/models/Comment';

export async function POST(req: Request) {
  await dbConnect;
  const { postId, userId, content } = await req.json();

  if (!postId || !userId || !content) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    const newComment = await Comment.create({ postId, userId, content });
    return NextResponse.json(newComment);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
  }
}
