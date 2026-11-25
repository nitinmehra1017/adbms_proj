import type { RowDataPacket } from 'mysql2';
import { pool } from '../db/pool.js';

export type SafeUser = {
  id: number;
  email: string;
  role: string;
};

export type UserWithPassword = SafeUser & {
  passwordHash: string;
};

type UserRow = RowDataPacket & {
  id: number;
  email: string;
  role: string;
  passwordHash: string;
};

type SafeUserRow = RowDataPacket & Omit<UserRow, 'passwordHash'>;

export async function findUserByEmail(email: string): Promise<UserWithPassword | null> {
  const [rows] = await pool.execute<UserRow[]>(
    `SELECT user_id AS id, email, role, password_hash AS passwordHash
     FROM users
     WHERE email = ?
     LIMIT 1`,
    [email]
  );

  const user = rows[0];
  return user ? toUserWithPassword(user) : null;
}

export async function findSafeUserById(id: number): Promise<SafeUser | null> {
  const [rows] = await pool.execute<SafeUserRow[]>(
    `SELECT user_id AS id, email, role
     FROM users
     WHERE user_id = ?
     LIMIT 1`,
    [id]
  );

  const user = rows[0];
  return user ? { id: user.id, email: user.email, role: user.role } : null;
}

function toUserWithPassword(row: UserRow): UserWithPassword {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    passwordHash: row.passwordHash
  };
}
