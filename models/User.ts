import {ObjectId} from "mongodb";

export interface User {
	_id?: ObjectId;
	email: string;
	password: string; // Note: In a real app, this would be hashed
	firstName: string;
	lastName: string;
	location: string;
	jobTitle: string;
	friends: ObjectId[];
	createdAt: Date;
	updatedAt: Date;
}

export interface UserLoginCredentials {
	email: string;
	password: string;
}
