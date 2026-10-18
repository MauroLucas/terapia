// Estado compartido entre escenas (inventario, pistas, flags).
export interface Pista {
  titulo: string
  texto: string
}

export const state = {
  pistas: [] as Pista[],
  inventario: [] as string[],
  radio: false,
  // Respuestas de Jorge en el consultorio: si dijo la verdad o mintió (qué consecuencias tiene, por definir)
  consulta: [] as { pregunta: string; verdad: boolean }[],
}

export function resetState() {
  state.pistas = []
  state.inventario = []
  state.radio = false
  state.consulta = []
}

export function addPista(titulo: string, texto: string): boolean {
  if (state.pistas.some((p) => p.titulo === titulo)) return false
  state.pistas.push({ titulo, texto })
  return true
}
