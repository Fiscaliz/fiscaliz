import fiscalizLogo from '@/assets/logo-fiscaliz.png';

export function FiscalizWatermark() {
  return (
    <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 overflow-hidden">
      <img 
        src={fiscalizLogo} 
        alt="" 
        className="w-80 h-80 opacity-[0.04] select-none"
        aria-hidden="true"
      />
    </div>
  );
}
