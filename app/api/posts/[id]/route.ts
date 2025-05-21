import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '../../../../utils/mongodb';
import Post from '../../../../models/Post';
import { verifyToken } from '../../../../utils/auth';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  const post = await Post.findById(params.id);
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(post);
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  const verify = verifyToken(req);
  if (!verify.success || !verify.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { content, image } = await req.json();
  const update: any = { content, updatedAt: Date.now() };
  if (image !== undefined) update.image = image;
  const post = await Post.findOneAndUpdate(
    { _id: params.id, author: verify.userId },
    update,
    { new: true }
  );
  if (!post) return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });
  return NextResponse.json(post);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  const verify = verifyToken(req);
  if (!verify.success || !verify.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const post = await Post.findOneAndDelete({ _id: params.id, author: verify.userId });
  if (!post) return NextResponse.json({ error: 'Not found or forbidden' }, { status: 404 });
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  await dbConnect();
  const verify = verifyToken(req);
  if (!verify.success || !verify.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { like } = await req.json();
  const post = await Post.findById(params.id);
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const userId = verify.userId;
  if (like) {
    if (!post.likes.includes(userId)) post.likes.push(userId);
  } else {
    post.likes = post.likes.filter((id: any) => id.toString() !== userId);
  }
  await post.save();
  return NextResponse.json(post);
}
