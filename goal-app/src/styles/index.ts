// Para evitar que algunas combinaciones se repitan mucho (inputs, labels, contenedores).
// Para ello Definimos aquí los strings reutilizables
// Es el equivalente a @apply de Tailwind en web.

export const styles = {
  // --- Layouts ---
  screenBase: 'flex-1 bg-[#0F0F13]',
  screenContent: 'flex-1 px-6 pt-10 pb-8 justify-between',

  // --- Formularios ---
  formCard: 'bg-[#1D1C22] rounded-2xl p-5 gap-4',
  fieldWrapper: 'gap-1',
  label: 'text-white text-sm font-medium',
  inputRow: 'flex-row items-center bg-[#2A2A35] rounded-xl px-3 h-12',
  inputIcon: 'mr-3',
  input: 'flex-1 text-white text-base',
  inputPlaceholder: '#525258',  // no es clase Tailwind, se pasa a placeholderTextColor

  // --- Botones ---
  btnPrimary: 'bg-[#C4F135] rounded-xl h-[48px] items-center justify-center w-full',
  btnPrimaryText: 'text-black font-bold text-base',
  btnSecondary: 'bg-[#2A2A35] rounded-xl h-[48px] items-center justify-center w-full',
  btnSecondaryText: 'text-white font-semibold text-base',

  // --- Tipografía ---
  displayText: 'text-white font-bold text-3xl',
  titleText: 'text-white font-semibold text-2xl',
  bodyText: 'text-[#8A9AA4] text-sm',
  linkText: 'text-[#18A2FB] text-sm',

  // --- Tabs ---
  tabContainer: 'flex-row bg-[#1D1C22] rounded-xl p-1 mb-6',
  tabActive: 'flex-1 bg-[#2A2A35] rounded-lg py-2 items-center',
  tabInactive: 'flex-1 py-2 items-center',
  tabActiveText: 'text-white font-semibold text-sm items-center',
  tabInactiveText: 'text-[#8A9AA4] text-sm',


    // --- Tabs Partidos ---
  tabPartido: ' flex-1 border-b-4 border-[#C8F558]',
  tabPartidoInactive: 'flex-1 border-b-1 border-[#C8F558]',

} as const;



