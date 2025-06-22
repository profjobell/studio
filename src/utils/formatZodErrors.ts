// src/utils/formatZodErrors.ts
import type { ZodIssue } from "zod";

export function formatZodErrors(errors?: ZodIssue[]): string {
  if (!errors || errors.length === 0) return "";
  return (
    " Errors: " +
    errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ")
  );
}
