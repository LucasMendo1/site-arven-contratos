export function Logo({ className = "h-8" }: { className?: string }) {
  return (
    <div className={`font-bold text-2xl tracking-tight text-white ${className}`}>
      <span className="text-3xl">ARVEN</span>
      <span className="block text-xs font-normal tracking-wide opacity-90">Assessoria de Aquisição</span>
    </div>
  );
}
