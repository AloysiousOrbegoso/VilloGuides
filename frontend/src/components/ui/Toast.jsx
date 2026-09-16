import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Icon } from "./icons";

const ToastContext = createContext(() => {});

/** Short confirmations such as "Link copied". One at a time, bottom center. */
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef();
  const show = useCallback((message, icon = "check") => {
    setToast({ message, icon, id: Date.now() });
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2400);
  }, []);
  return (
    <ToastContext.Provider value={show}>
      {children}
      <div aria-live="polite" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] pointer-events-none">
        {toast && (
          <div key={toast.id} className="flex items-center gap-2 bg-charcoal text-offwhite rounded-full px-4 h-10 text-sm font-semibold shadow-lg">
            <Icon name={toast.icon} />
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
