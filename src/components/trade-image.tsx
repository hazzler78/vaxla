import Image from "next/image";
import {
  Bike,
  Briefcase,
  GraduationCap,
  House,
  Laptop,
  Package,
  type LucideIcon,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Elektronik: Laptop,
  Transport: Bike,
  Hem: House,
  Utbildning: GraduationCap,
  Övrigt: Package,
  Uppdrag: Briefcase,
};

const PLACEHOLDER_BACKGROUND =
  "linear-gradient(145deg, #dfe4e7 0%, #2a3439 72%)";

type TradeImageProps = {
  image: string;
  alt: string;
  category: string;
  variant: "card" | "detail";
  priority?: boolean;
};

function frameClass(variant: TradeImageProps["variant"]): string {
  if (variant === "card") {
    return "relative aspect-[4/3] overflow-hidden bg-steel/10 sm:aspect-square";
  }
  return "relative min-h-[320px] overflow-hidden bg-steel/10 lg:min-h-[520px]";
}

export function TradeImage({
  image,
  alt,
  category,
  variant,
  priority = false,
}: TradeImageProps) {
  const frame = frameClass(variant);

  if (image.trim()) {
    return (
      <div className={frame}>
        <Image
          src={image}
          alt={alt}
          fill
          priority={priority}
          className={
            variant === "card"
              ? "object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              : "object-cover"
          }
          sizes={
            variant === "card" ? "140px" : "(max-width: 1024px) 100vw, 55vw"
          }
        />
      </div>
    );
  }

  const Icon = CATEGORY_ICONS[category] ?? Package;
  const iconSize = variant === "card" ? 36 : 72;

  return (
    <div
      className={`${frame} flex items-center justify-center`}
      style={{ background: PLACEHOLDER_BACKGROUND }}
    >
      <div className="flex flex-col items-center justify-center gap-3">
        <Icon
          aria-hidden
          size={iconSize}
          strokeWidth={1.5}
          className="text-[#f4f6f7] ring-1 ring-white/30"
        />
        {variant === "detail" ? (
          <span className="text-xs uppercase tracking-[0.14em] text-[#f4f6f7]">
            {category}
          </span>
        ) : null}
      </div>
    </div>
  );
}
