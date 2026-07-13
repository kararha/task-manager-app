import { ReactNode } from "react";
import { ArrowRightIcon } from "lucide-react";
import { cn } from "../utils";

export function BentoGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "grid w-full auto-rows-auto md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8",
        className
      )}
    >
      {children}
    </div>
  );
}

export function BentoCard({
  name,
  className,
  background,
  Icon,
  description,
  href,
  cta,
  children,
  ...props
}: {
  name?: string;
  className?: string;
  background?: ReactNode;
  Icon?: any;
  description?: string;
  href?: string;
  cta?: string;
  children?: ReactNode;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden card p-0 transition-all duration-300 hover:shadow-md hover:border-[var(--color-border-strong)]",
        className
      )}
      {...props}
    >
      {background && <div className="absolute inset-0 z-0">{background}</div>}
      
      {children ? (
        <div className="relative z-10 h-full w-full">{children}</div>
      ) : (
        <>
          <div className="relative z-10 flex flex-col gap-2 p-6 pointer-events-none">
            {Icon && <Icon className="h-8 w-8 text-slate-500 transition-all duration-300 group-hover:scale-105" />}
            <h3 className="t-title-md mt-2">{name}</h3>
            <p className="max-w-lg t-body-sm">{description}</p>
          </div>

          {cta && href && (
            <div className="pointer-events-none absolute bottom-0 flex w-full translate-y-10 transform-gpu flex-row items-center p-6 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 z-20">
              <a href={href} className="btn btn-primary btn-sm pointer-events-auto">
                {cta}
                <ArrowRightIcon className="h-4 w-4" />
              </a>
            </div>
          )}
        </>
      )}
      
      <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-slate-950/[.02] group-hover:dark:bg-slate-50/[.02]" />
    </div>
  );
}
