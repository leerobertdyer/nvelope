
export default function SpotlightOverlay({ targetRect }: { targetRect: DOMRect | null }) {
  if (!targetRect) return null;

  const radius = Math.max(targetRect.width, targetRect.height) / 2 + 22; // add padding
  const centerX = targetRect.left + targetRect.width / 2;
  const centerY = targetRect.top + targetRect.height / 2;

  // Create a radial-gradient mask with a transparent hole
  const maskStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    pointerEvents: "none",
    zIndex: 9999,
    WebkitMaskImage: `radial-gradient(circle ${radius}px at ${centerX}px ${centerY}px, transparent 0, transparent ${radius - 8}px, rgba(0,0,0,1) ${radius}px)`,
    maskImage: `radial-gradient(circle ${radius}px at ${centerX}px ${centerY}px, transparent 0, transparent ${radius - 8}px, rgba(0,0,0,1) ${radius}px)`,
    background: "rgba(48,48,48,0.95)",
    transition: "mask-position 0.2s, -webkit-mask-position 0.2s"
  };

  return <div style={maskStyle} />;
}
