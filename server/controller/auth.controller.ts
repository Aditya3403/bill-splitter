
import type { Context } from "hono";
import type { Env } from "../types";
import { hash, compare } from "bcryptjs";
import { SignJWT } from "jose";

interface SignupBody {
  name: string;
  email: string;
  password: string;
}

interface LoginBody {
  email: string;
  password: string;
}

const generateToken = async (userId: number, secret: string) => {
  const secretKey = new TextEncoder().encode(secret);

  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
};

const getOrCreateHome = async (
  DB: D1Database,
  userId: number,
  userName: string
): Promise<number> => {
  const existingHome = await DB
    .prepare("SELECT id FROM homes WHERE user_id = ? LIMIT 1")
    .bind(userId)
    .first<{ id: number }>();

  if (existingHome) {
    return existingHome.id;
  }

  const newHome = await DB
    .prepare(
      `INSERT INTO homes (name, user_id)
       VALUES (?, ?)
       RETURNING id`
    )
    .bind(`${userName}'s Home`, userId)
    .first<{ id: number }>();

  if (!newHome) {
    throw new Error("Failed to create home.");
  }

  return newHome.id;
};

// POST /api/auth/signup
export const signup = async (c: Context<{ Bindings: Env }>) => {
  try {
    const body = await c.req.json<SignupBody>();

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!name || !email || !password) {
      return c.json(
        { error: "Name, email and password are required" },
        400
      );
    }

    if (name.length > 100) {
      return c.json(
        { error: "Name cannot exceed 100 characters" },
        400
      );
    }

    if (
      email.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return c.json(
        { error: "Please provide a valid email address" },
        400
      );
    }

    if (password.length < 8 || password.length > 128) {
      return c.json(
        { error: "Password must be between 8 and 128 characters" },
        400
      );
    }

    const existingUser = await c.env.DB
      .prepare("SELECT id FROM users WHERE email = ?")
      .bind(email)
      .first();

    if (existingUser) {
      return c.json(
        { error: "Email is already registered" },
        409
      );
    }

    const passwordHash = await hash(password, 12);

    const user = await c.env.DB
      .prepare(`
        INSERT INTO users (name, email, password_hash)
        VALUES (?, ?, ?)
        RETURNING id, name, email, created_at
      `)
      .bind(name, email, passwordHash)
      .first<{
        id: number;
        name: string;
        email: string;
        created_at: string;
      }>();

    if (!user) {
      return c.json(
        { error: "Unable to create account" },
        500
      );
    }

    const homeId = await getOrCreateHome(
      c.env.DB,
      user.id,
      user.name
    );

    const token = await generateToken(
      user.id,
      c.env.JWT_SECRET
    );

    return c.json(
      {
        message: "Account created successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.created_at,
        },
        homeId,
        token,
      },
      201
    );
  } catch (error) {
    console.error("Signup error:", error);

    return c.json(
      { error: "Unable to create account" },
      500
    );
  }
};

// POST /api/auth/login
export const login = async (c: Context<{ Bindings: Env }>) => {
  try {
    const body = await c.req.json<LoginBody>();

    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return c.json(
        { error: "Email and password are required" },
        400
      );
    }

    const user = await c.env.DB
      .prepare(`
        SELECT id, name, email, password_hash
        FROM users
        WHERE email = ?
      `)
      .bind(email)
      .first<{
        id: number;
        name: string;
        email: string;
        password_hash: string;
      }>();

    if (!user) {
      return c.json(
        { error: "Invalid email or password" },
        401
      );
    }

    const passwordMatches = await compare(
      password,
      user.password_hash
    );

    if (!passwordMatches) {
      return c.json(
        { error: "Invalid email or password" },
        401
      );
    }

    const homeId = await getOrCreateHome(
      c.env.DB,
      user.id,
      user.name
    );

    const token = await generateToken(
      user.id,
      c.env.JWT_SECRET
    );
    // console.log(homeId)
    return c.json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      homeId,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);

    return c.json(
      { error: "Unable to login" },
      500
    );
  }
};
