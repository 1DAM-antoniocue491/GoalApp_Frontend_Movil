export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  favoriteLeagues: string[];
}

export interface Credential {
  email: string;
  password: string;
  userId: string;
}
