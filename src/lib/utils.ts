import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function for constructing className strings with Tailwind conflict resolution.
 *
 * Combines clsx for conditional classes with tailwind-merge for deduplication.
 * Use this for all component className props to ensure overrides work correctly.
 *
 * @example
 * cn("p-4", "p-2") // => "p-2" (later wins)
 * cn("text-red-500", isActive && "text-blue-500") // conditional
 * cn(buttonVariants({ size: "lg" }), className) // CVA + prop override
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
