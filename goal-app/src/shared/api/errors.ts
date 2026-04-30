/**
 * ApiError — error tipado de la capa HTTP.
 * Archivo independiente para evitar require-cycle entre client e interceptors.
 */
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}
