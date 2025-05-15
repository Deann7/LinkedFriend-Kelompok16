import {NextRequest} from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = "linkedfriend-secret-key";

interface TokenPayload {
	userId: string;
	email: string;
	iat?: number;
	exp?: number;
}

interface VerifyResult {
	success: boolean;
	userId?: string;
	email?: string;
	message?: string;
}

export function verifyToken(req: NextRequest): VerifyResult {
	try {
		// Get token from Authorization header or cookies
		const authHeader = req.headers.get("Authorization");
		let token: string | undefined;

		if (authHeader && authHeader.startsWith("Bearer ")) {
			token = authHeader.substring(7);
		} else {
			// Try to get from cookies
			const cookies = req.cookies;
			token = cookies.get("token")?.value;
		}

		if (!token) {
			return {success: false, message: "No token provided"};
		}

		console.log("token", token, JWT_SECRET);
		// Verify token
		const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;

		return {
			success: true,
			userId: decoded.userId,
			email: decoded.email,
		};
	} catch (error) {
		console.error("Token verification error:", error);
		return {success: false, message: "Invalid token"};
	}
}
