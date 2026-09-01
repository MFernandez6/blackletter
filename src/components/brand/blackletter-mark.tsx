import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  markClassName?: string;
  as?: "h1" | "span";
};

export function BlackletterMark({
  className,
  markClassName,
  as: Tag = "span",
}: Props) {
  return (
    <Tag className={cn("relative inline-flex justify-center", className)}>
      <span>BLACKLETTER</span>
      <span
        className={cn(
          "absolute left-full top-[0.28em] ml-0.5 font-sans text-[0.38em] font-semibold leading-none tracking-normal text-brand-gold/80",
          markClassName
        )}
        aria-label="trademark"
      >
        TM
      </span>
    </Tag>
  );
}
