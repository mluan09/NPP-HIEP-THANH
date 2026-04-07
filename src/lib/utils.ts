export type ClassValue =
  | string
  | number
  | null
  | undefined
  | false
  | Record<string, boolean | undefined | null>
  | ClassValue[]
  | readonly ClassValue[];

/**
 * cn - utility to combine className values (shadcn/animate-ui compatible).
 * This implementation is dependency-free so the project doesn't need `clsx`/`tailwind-merge`.
 */
export function cn(...inputs: ClassValue[]): string {
  const out: string[] = [];

  const pushValue = (value: ClassValue): void => {
    if (!value) return;

    if (typeof value === 'string' || typeof value === 'number') {
      out.push(String(value));
      return;
    }

    if (Array.isArray(value)) {
      for (const v of value) pushValue(v);
      return;
    }

    if (typeof value === 'object') {
      for (const [key, enabled] of Object.entries(value)) {
        if (enabled) out.push(key);
      }
    }
  };

  for (const input of inputs) pushValue(input);
  return out.join(' ');
}

