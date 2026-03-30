//  Centralizanmos todos los colores del design system en un solo lugar.
// Esto evita escribir hex codes dispersos por el proyecto.
// Todos lo cambios de colores se hacen aquí.

export const Colors = {
  // Backgrounds (del style guide)
  bg: {
    base: "#0F0F13", // fondo más oscuro, la pantalla principal
    surface1: "#1D1C22", // tarjetas, formularios
    surface2: "#2A2A35", // inputs, elementos elevados
  },

  // Textos
  text: {
    primary: "#FFFFFF",
    secondary: "#8A9AA4",
    disabled: "#525258",
  },

  // Marca (brand)
  brand: {
    primary: "#C4F135", // verde lima → botón principal, activo
    secondary: "#00D425", // verde → acento secundario
    accent: "#18A2FB", // azul → links como "¿Olvidó la contraseña?"
  },

  // Semánticos
  semantic: {
    error: "#FF4534",
    warning: "#FFD60A",
    success: "#32D74B",
  },
} as const;
