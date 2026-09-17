import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { SparkleIcon, CheckIcon } from './icons'

type Toast = { id: number; message: string; tone: 'ai' | 'done' }
type ToastCtx = { notify: (message: string, tone?: 'ai' | 'done') => void }

const Ctx = createContext<ToastCtx>({ notify: () => {} })

export function useToast() {
  return useContext(Ctx)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const notify = useCallback((message: string, tone: 'ai' | 'done' = 'ai') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, message, tone }])
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id))
    }, 4200)
  }, [])

  return (
    <Ctx.Provider value={{ notify }}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex w-[min(92vw,26rem)] flex-col gap-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-start gap-3 rounded-xl border border-line bg-white/95 p-3.5 shadow-[0_16px_40px_-24px_rgba(10,11,14,0.5)] backdrop-blur animate-[toastIn_.24s_ease-out]"
          >
            <span
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border ${
                t.tone === 'done'
                  ? 'border-[var(--color-ok)]/30 text-[var(--color-ok)]'
                  : 'border-line text-ink-700'
              }`}
            >
              {t.tone === 'done' ? <CheckIcon width={16} height={16} /> : <SparkleIcon width={16} height={16} />}
            </span>
            <p className="text-sm leading-snug text-ink-800">{t.message}</p>
          </div>
        ))}
      </div>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </Ctx.Provider>
  )
}
