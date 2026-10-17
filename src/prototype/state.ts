// Estado compartido entre escenas (inventario, pistas, flags).
export interface Pista {
  titulo: string
  texto: string
}

export const state = {
  pistas: [] as Pista[],
  inventario: [] as string[],
  radio: false,
}

export function resetState() {
  state.pistas = []
  state.inventario = []
  state.radio = false
}

export function addPista(titulo: string, texto: string): boolean {
  if (state.pistas.some((p) => p.titulo === titulo)) return false
  state.pistas.push({ titulo, texto })
  return true
}
