import { FIRM } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { BlacklineLogo, BlacklineSeal } from "@/components/brand/blackline-mark";

export function Letterhead({ className }: { className?: string }) {
  return (
    <header className={cn("mb-10", className)}>
      <BlacklineLogo className="mx-auto w-[220px]" priority />
      <div className="mt-4 h-px bg-[#C6A85B]" />
      <p className="!m-0 mt-3 text-center font-sans text-[9px] font-bold uppercase tracking-[0.16em] text-[#8a7a4a]">
        {FIRM.address} · {FIRM.phone} · {FIRM.email} · {FIRM.website}
      </p>
    </header>
  );
}

export function LetterSeal({ className }: { className?: string }) {
  return (
    <div className={cn("mt-5 flex justify-center", className)}>
      <BlacklineSeal size={88} />
    </div>
  );
}

export function LetterFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("mt-14 border-t border-[#C6A85B]/80 pt-3", className)}>
      <p className="!m-0 font-sans text-[8px] font-bold uppercase tracking-[0.16em] text-[#8a7a4a]">
        {FIRM.legalName} · Licensed public adjusters · {FIRM.statuteCite}
      </p>
      <p className="!m-0 mt-1.5 font-sans text-[8px] uppercase tracking-[0.14em] text-[#9a8b68]">
        Confidential · prepared solely for the named insured and their carrier
      </p>
    </footer>
  );
}
