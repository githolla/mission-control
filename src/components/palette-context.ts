import { createContext, useContext } from 'react'

/** Lets any descendant (e.g. TopBar) open the command palette Layout owns. */
export type PaletteContextValue = { open: () => void }

export const PaletteContext = createContext<PaletteContextValue>({ open: () => {} })

export function usePalette() {
  return useContext(PaletteContext)
}
