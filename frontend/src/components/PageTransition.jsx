import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function PageTransition({ children }) {
  const location = useLocation();
  const [state, setState] = useState('enter'); // 'enter' | 'exit'

  useEffect(() => {
    // trigger re-enter on pathname change
    setState('enter');
    // optional cleanup for exit animation if needed
    const timeout = setTimeout(() => setState('idle'), 400);
    return () => clearTimeout(timeout);
  }, [location.pathname]);

  return (
    <div
      className={`transition-wrapper ${state}`}
      aria-live="polite"
    >
      {children}
    </div>
  );
}

