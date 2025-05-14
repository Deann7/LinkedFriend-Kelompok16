import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '@/utils/mongodb';
import bcrypt from 'bcryptjs';
import { User } from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    // Get request body
    const { email, password, firstName, lastName, location, jobTitle } = await request.json();

    // Validate required fields
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json({ success: false, message: 'Missing required fields' }, { status: 400 });
    }

    // Connect to MongoDB
    const client = await clientPromise;
    const db = client.db();
    
    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });
    
    if (existingUser) {
      return NextResponse.json({ success: false, message: 'Email already registered' }, { status: 409 });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user object
    const newUser: User = {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      location: location || '',
      jobTitle: jobTitle || '',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Insert user into database
    const result = await db.collection('users').insertOne(newUser);

    // Create a user object to return (excluding password)
    const userToReturn = {
      _id: result.insertedId,
      email,
      firstName,
      lastName,
      location,
      jobTitle
    };

    return NextResponse.json({ success: true, user: userToReturn }, { status: 201 });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json({ success: false, message: 'Registration failed' }, { status: 500 });
  }
}
