import { accounts, Account, Role } from "./data";

export function login(email: string, password: string): Account | null {
  return (
    accounts.find(
      (acc) =>
        acc.email.trim() === email.trim() &&
        acc.password.trim() === password.trim()
    ) || null
  );
}