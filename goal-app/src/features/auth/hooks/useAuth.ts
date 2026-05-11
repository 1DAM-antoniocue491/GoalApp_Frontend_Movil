/**
 * Punto único de importación del contexto de autenticación.
 *
 * Reexportar el hook y el provider desde aquí permite que las pantallas no
 * dependan directamente de la ruta interna de providers. Si la ubicación del
 * AuthProvider cambia, solo habría que actualizar este archivo.
 */
export { useAuth, AuthProvider } from '@/src/providers/AuthProvider';
