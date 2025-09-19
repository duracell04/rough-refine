import { useEffect, useRef } from "react";
import { spriteMarkup } from "@roughrefine/brand";

export function BrandSprite() {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = spriteMarkup;
  }, []);

  return <div ref={ref} aria-hidden style={{ display: "none" }} />;
}
