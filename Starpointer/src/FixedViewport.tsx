import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

const DESIGN_W = 1024;
const DESIGN_H = 600;

type Props = { children: ReactNode };

export default function FixedViewport({ children }: Props) {
  const [scale, setScale] = useState(1);

  const updateScale = useMemo(() => () => {
    const ww = window.innerWidth;
    const wh = window.innerHeight;
    setScale(Math.min(ww / DESIGN_W, wh / DESIGN_H));
    document.body.style.margin = "0";
    document.body.style.background = "#0f1115";
    document.body.style.overflow = "hidden";
  }, []);

  useEffect(() => {
    updateScale();
    window.addEventListener("resize", updateScale);
    window.addEventListener("orientationchange", updateScale);
    return () => {
      window.removeEventListener("resize", updateScale);
      window.removeEventListener("orientationchange", updateScale);
    };
  }, [updateScale]);

  return (
    <div style={{ position: "fixed", inset: 0, overflow: "hidden",
      padding: "env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)" }}>
      <div style={{
        width: `${DESIGN_W}px`,
        height: `${DESIGN_H}px`,
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        position: "absolute",
        left: "50%", top: "50%",
        marginLeft: `${-(DESIGN_W / 2)}px`,
        marginTop: `${-(DESIGN_H / 2)}px`,
      }}>
        {children}
      </div>
    </div>
  );
}
