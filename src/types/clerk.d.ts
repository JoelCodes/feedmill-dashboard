/**
 * Clerk TypeScript type definitions for role-based access control.
 *
 * This module augments Clerk's global CustomJwtSessionClaims interface
 * to provide compile-time type safety for role checking throughout the app.
 */

export {};

/**
 * User roles in the CGM Dashboard.
 * - 'demo': Access to demo routes (/demo/*)
 * - 'admin': Full administrative access
 * - 'user': Standard authenticated user
 */
export type Role = 'demo' | 'admin' | 'user';

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      roles?: Role[];
    };
  }
}
