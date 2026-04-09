import { v4 as uuidv4 } from 'uuid';

// Database client type for Cloudflare D1
export interface D1Database {
  prepare(sql: string): D1Statement;
  bind(...args: any[]): D1Database;
  exec(sql: string): Promise<D1ExecResult>;
}

export interface D1Statement {
  bind(...args: any[]): D1Statement;
  first<T = any>(...args: any[]): Promise<T | null>;
  run(...args: any[]): Promise<D1Response>;
  all<T = any>(...args: any[]): Promise<D1Result<T>>;
}

export interface D1Response {
  success: boolean;
  error?: string;
  meta?: {
    rows_written?: number;
    changes?: number;
  };
}

export interface D1Result<T> {
  success: boolean;
  results?: T[];
  error?: string;
}

export interface D1ExecResult {
  count?: number;
  error?: string;
}

// Helper to generate UUID
export function generateId(): string {
  return uuidv4();
}

// Helper to get current datetime
export function now(): string {
  return new Date().toISOString();
}

// Helper to parse JSON safely
export function parseJSON<T>(str: string | null, defaultValue: T): T {
  if (!str) return defaultValue;
  try {
    return JSON.parse(str);
  } catch {
    return defaultValue;
  }
}

// Database initialization SQL (for local dev)
export const schema = `
-- Run this SQL to initialize your D1 database
-- wrangler d1 execute warehouse-db --local --file=src/db/schema.sql
`.trim();
