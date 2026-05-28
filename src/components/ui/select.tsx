"use client";

import React, { useState, useRef, useEffect } from "react";
import { LineIcon } from "@/components/shared/line-icon";

export interface SelectOption {
  value: string;
  label: string;
  sublabel?: string;
}

export interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  menuClassName?: string;
  align?: "left" | "right";
  fullWidth?: boolean;
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Select option...",
  className = "",
  menuClassName = "",
  align = "left",
  fullWidth = false,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-block text-left ${fullWidth ? "w-full" : ""}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center justify-between gap-2 px-3.5 py-2
          bg-[#18181b] border border-[#27272a] hover:border-white/[0.15]
          text-xs text-[#fafafa] font-semibold rounded-xl cursor-pointer
          transition-all duration-300 focus:outline-none focus:border-auth-accent
          focus:ring-2 focus:ring-auth-accent-glow/50
          ${fullWidth ? "w-full" : ""}
          ${isOpen ? "border-auth-accent ring-2 ring-auth-accent-glow/50" : ""}
          ${className}
        `}
      >
        <span className="truncate pr-2">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <LineIcon name="chevron-down"
          className={`h-4 w-4 text-[#52525b] transition-transform duration-300 shrink-0 ${
            isOpen ? "rotate-180 text-auth-accent" : "rotate-0"
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`
            absolute z-50 mt-1.5 min-w-[200px] max-h-60 overflow-y-auto
            glass-premium rounded-xl py-1.5 shadow-2xl animate-dropdown-enter
            focus:outline-none
            ${align === "right" ? "right-0" : "left-0"}
            ${fullWidth ? "w-full" : ""}
            ${menuClassName}
          `}
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "var(--color-auth-border) transparent",
          }}
        >
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-auth-text-3 italic text-center">
              No options available
            </div>
          ) : (
            options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleSelect(opt.value)}
                  className={`
                    w-full text-left px-3.5 py-2.5 text-xs font-semibold
                    flex items-center justify-between transition-colors duration-200
                    hover:bg-white/5 cursor-pointer
                    ${
                      isSelected
                        ? "text-auth-accent bg-auth-accent-dim/30"
                        : "text-auth-text-2 hover:text-white"
                    }
                  `}
                >
                  <div className="flex flex-col gap-0.5 truncate pr-2">
                    <span className="truncate">{opt.label}</span>
                    {opt.sublabel && (
                      <span className="text-[10px] font-normal text-auth-text-3 truncate">
                        {opt.sublabel}
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <LineIcon name="checkmark" className="h-3.5 w-3.5 text-auth-accent shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
