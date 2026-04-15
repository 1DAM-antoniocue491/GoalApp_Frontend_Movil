import type { User } from "@/src/shared/types/user";
import type { Credential } from "@/src/shared/types/user";
import { mockUsers, mockCredentials } from "@/src/mocks/data";

/**
 * Verifica si las credenciales son válidas
 */
export function validateCredentials(email: string, password: string): User | null {
  const credential = mockCredentials.find(
    (c) =>
      c.email.toLowerCase() === email.toLowerCase() && c.password === password,
  );

  if (!credential) return null;

  const user = mockUsers.find((u) => u.id === credential.userId);
  return user || null;
}

/**
 * Crea un nuevo usuario mock (para registro simulado)
 */
export function createUser(name: string, email: string, password: string): User {
  const newUser: User = {
    id: `user-${Date.now()}`,
    name,
    email,
    avatar: undefined,
    favoriteLeagues: [],
  };

  mockUsers.push(newUser);
  mockCredentials.push({ email, password, userId: newUser.id });

  return newUser;
}