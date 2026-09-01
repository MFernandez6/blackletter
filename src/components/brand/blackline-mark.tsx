import { cn } from "@/lib/utils";

type Props = {
  size?: number;
  className?: string;
  title?: string;
};

/**
 * Blackline datum mark — a framed horizon and plumb meeting at the origin.
 * Uses currentColor so it reads gold on navy or gold on ivory stationery.
 */
export function BlacklineMark({
  size = 40,
  className,
  title = "Blackline Public Adjusters",
}: Props) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 80 80"
      width={size}
      height={size}
      className={cn("shrink-0", className)}
      role="img"
      aria-label={title}
    >
      <rect
        x="6"
        y="6"
        width="68"
        height="68"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <line
        x1="16"
        y1="50"
        x2="64"
        y2="50"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <line
        x1="28"
        y1="18"
        x2="28"
        y2="62"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="28" cy="50" r="2.6" fill="currentColor" />
    </svg>
  );
}
