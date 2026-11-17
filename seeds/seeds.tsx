/**
 * from Paper
 * https://app.paper.design/file/01KQZE7F3TW16F8W01NYYQ5C78/1-0/5ZS-0
 * on Nov 17, 2026
 * Design seeds (light left, dark right). Reference only; not imported by the app.
 */
const font = '"Inter-Regular", "Inter", system-ui, sans-serif';
const row = (bg: string, color: string, size: number, line: number, padY: number, padX: number, ring?: string) => ({
  alignItems: 'center', backgroundColor: bg, borderRadius: 8, boxShadow: ring, display: 'flex', gap: 10,
  paddingBlock: padY, paddingInline: padX, width: 500, color, fontFamily: font, fontSize: size, lineHeight: `${line}px`,
}) as const;

export default function Seeds() {
  return (
    <div style={{ display: 'flex', gap: 38 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 17 }}>
        <div style={row('#F0F0F0', '#000000', 16, 20, 12, 16, '#91919140 0px 0px 0px 0.5px')}>This is p8</div>
        <div style={row('#F4F4F4', '#C0C0C0', 14, 18, 8, 12)}>Placeholder</div>
        <div style={row('#E5E5E5', '#C0C0C0', 14, 18, 8, 12)}>Placeholder</div>
      </div>
      <div style={{ backgroundColor: '#1D1D1D', display: 'flex', flexDirection: 'column', gap: 17, padding: 23 }}>
        <div style={row('#1D1D1D', '#E1E1E1', 16, 20, 12, 16, '#7A7A7A40 0px 0px 0px 0.5px')}>This is p8</div>
        <div style={row('#2A2A2A', '#C0C0C0', 14, 18, 8, 12)}>Placeholder</div>
        <div style={row('#373737', '#C0C0C0', 14, 18, 8, 12)}>Placeholder</div>
      </div>
    </div>
  );
}
