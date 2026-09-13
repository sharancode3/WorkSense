import React, { forwardRef } from "react";
import { Search, X } from "lucide-react";
import { Input, InputProps } from "@/components/ui/input";

export interface SearchInputProps extends Omit<InputProps, "leftAddon" | "rightAddon"> {
  onClear?: () => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ value, onClear, onChange, placeholder = "Search...", ...props }, ref) => {
    const hasValue = Boolean(value);

    return (
      <Input
        ref={ref}
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        leftAddon={<Search className="h-4 w-4" aria-hidden="true" />}
        rightAddon={
          hasValue && onClear ? (
            <button
              type="button"
              onClick={onClear}
              className="text-content-muted hover:text-content-primary p-0.5 rounded focus-visible:outline-none"
              aria-label="Clear search query"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          ) : null
        }
        {...props}
      />
    );
  }
);

SearchInput.displayName = "SearchInput";
