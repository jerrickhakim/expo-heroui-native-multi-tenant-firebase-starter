import type { User as FirebaseUser } from "firebase/auth";

/**
 * The current User type used throughout the app.
 * Change this export to use a different auth provider.
 */
export type User = FirebaseUser;

/**
 * Re-export FirebaseUser for cases where Firebase-specific properties are needed.
 */
export type { FirebaseUser };
