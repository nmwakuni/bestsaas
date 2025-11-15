import { cn } from "@/lib/utils";
import { ReactNode, HTMLAttributes } from "react";

interface CardProps extends Omit<HTMLAttributes<HTMLDivElement>, "className"> {
  children: ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

export function Card({ children, className, padding = "md", onClick, ...props }: CardProps) {
  const paddingStyles = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div
      className={cn(
        "rounded-xl bg-white shadow-md",
        paddingStyles[padding],
        onClick && "cursor-pointer transition-shadow hover:shadow-lg",
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return <div className={cn("mb-4", className)}>{children}</div>;
}

interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export function CardTitle({ children, className }: CardTitleProps) {
  return <h3 className={cn("text-lg font-semibold text-gray-900", className)}>{children}</h3>;
}

interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={className}>{children}</div>;
}
