import { openDatabaseSync } from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import * as schema from "./schema";
import { Platform } from "react-native";

// Safe database initialization with error handling
type DatabaseType = ReturnType<typeof drizzle>;
let db: DatabaseType | null = null;
let dbError: Error | null = null;

try {
  if (Platform.OS !== 'web') {
    // Only initialize SQLite on native platforms
    const expo = openDatabaseSync("stayintouch.db");
    expo.execSync("PRAGMA journal_mode = WAL;");
    expo.execSync("PRAGMA foreign_keys = ON;");
    
    db = drizzle(expo, { schema });
    console.log('Database initialized successfully');
  } else {
    console.log('Web platform: using in-memory store');
  }
} catch (error) {
  console.error('Failed to initialize database:', error);
  dbError = error as Error;
  
  // Create a mock db for web or error fallback
  if (Platform.OS === 'web') {
    db = {
      select: () => ({ from: () => ({ all: () => [], get: () => null }) }),
      insert: () => ({ values: () => ({ run: () => {} }) }),
      update: () => ({ set: () => ({ where: () => ({ run: () => {} }) }) }),
      delete: () => ({ where: () => ({ run: () => {} }) }),
      run: () => {},
    } as any;
  }
}

export { db, dbError };

// Helper function to check database health
export function checkDatabaseHealth(): {
  healthy: boolean;
  error?: string;
  platform: string;
} {
  if (Platform.OS === 'web') {
    return { healthy: true, platform: 'web' };
  }
  
  if (dbError) {
    return { 
      healthy: false, 
      error: dbError.message,
      platform: Platform.OS 
    };
  }
  
  if (!db) {
return { 
      healthy: false, 
      error: 'Database not initialized',
      platform: Platform.OS 
    };
  }
  
  return { healthy: true, platform: Platform.OS };
}

// Safe database access with error handling
export function withDatabase<T>(
  operation: (db: DatabaseType) => T,
  fallback: T
): T {
  if (!db) {
    console.warn('Database not available, using fallback');
    return fallback;
  }
  
  try {
    return operation(db);
  } catch (error) {
    console.error('Database operation failed:', error);
    return fallback;
  }
}

// For operations that don't return a value
export function withDatabaseVoid(
  operation: (db: DatabaseType) => void,
  onError?: () => void
): void {
  if (!db) {
    console.warn('Database not available');
    onError?.();
    return;
  }
  
  try {
    operation(db);
  } catch (error) {
    console.error('Database operation failed:', error);
    onError?.();
  }
}
