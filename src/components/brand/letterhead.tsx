import { FIRM } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { BlacklineMark } from "@/components/brand/blackline-mark";

export function Letterhead({ className }: { className?: string }) {
  return (
    <header className={cn("mb-10", className)}>
      <div className="flex items-center gap-4">
        <BlacklineMark size={52} className="text-[#C6A85B]" />
        <div className="min-w-0">
          <p className="font-serif text-[1.55rem] font-bold leading-none tracking-[0.22em] text-[#0F1C2E] sm:text-[1.7rem]">
            BLACKLINE
          </p>
          <p className="mt-1.5 font-serif text-[10px] font-semibold uppercase tracking-[0.22em] text-[#0F1C2E]/65">
            Public Adjusters LLC
          </p>
        </div>
      </div>
      <div className="mt-5 h-px bg-[#C6A85B]" />
      <p className="mt-3 font-sans text-[9px] font-bold uppercase tracking-[0.16em] text-[#8a7a4a]">
        {FIRM.address} · {FIRM.phone} · {FIRM.email} · {FIRM.website}
      </p>
    </header>
  );
}

export function LetterFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("mt-14 border-t border-[#C6A85B]/80 pt-3", className)}>
      <p className="font-sans text-[8px] font-bold uppercase tracking-[0.16em] text-[#8a7a4a]">
        {FIRM.legalName} · Licensed public adjusters · {FIRM.statuteCite}
      </p>
      <p className="mt-1.5 font-sans text-[8px] uppercase tracking-[0.14em] text-[#9a8b68]">
        Confidential · prepared solely for the named insured and their carrier
      </p>
    </footer>
  );
}
