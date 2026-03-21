import { createContext, useContext } from 'react'

const DemoContext = createContext(null)

export function useDemo() {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error('useDemo must be used within DemoProvider')
  return ctx
}

export default DemoContext

