import { FIRM } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { BlacklineMark } from "@/components/brand/blackline-mark";

const MARK_H = 52;

export function Letterhead({ className }: { className?: string }) {
  return (
    <header className={cn("mb-10", className)}>
      <div className="flex items-center gap-3.5">
        <BlacklineMark size={MARK_H} className="text-[#C6A85B]" />
        <div className="flex min-w-0 flex-col justify-center leading-none">
          <p className="!m-0 font-serif text-[52px] font-bold leading-none tracking-[0.04em] text-[#0F1C2E]">
            BLACKLINE
          </p>
          <p className="!m-0 -mt-1.5 font-serif text-[11px] font-semibold uppercase leading-none tracking-[0.18em] text-[#0F1C2E]/65">
            Public Adjusters LLC
          </p>
        </div>
      </div>
      <div className="mt-5 h-px bg-[#C6A85B]" />
      <p className="!m-0 mt-3 font-sans text-[9px] font-bold uppercase tracking-[0.16em] text-[#8a7a4a]">
        {FIRM.address} · {FIRM.phone} · {FIRM.email} · {FIRM.website}
      </p>
    </header>
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
