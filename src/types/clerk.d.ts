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
 * - 'mill_operator': Edit role for mill production dashboard (v2.0).
 *   Gates mutating server actions and edit affordances; does NOT gate
 *   page access — any authenticated user may view `/` in read-only mode
 *   (CONTEXT.md D-01, Phase 31).
 */
export type Role = 'demo' | 'admin' | 'user' | 'mill_operator';

declare global {
  interface CustomJwtSessionClaims {
    metadata: {
      roles?: Role[];
    };
  }
}
