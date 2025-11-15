"use client";

import { cn } from "@/lib/utils";
import { Search } from "lucide-react";
import { InputHTMLAttributes, forwardRef } from "react";

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, onSearch, ...props }, ref) => {
    return (
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={ref}
          type="search"
          className={cn(
            "w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 transition focus:border-transparent focus:ring-2 focus:ring-primary-600",
            className
          )}
          placeholder="Search..."
          onChange={(e) => onSearch?.(e.target.value)}
          {...props}
        />
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";
