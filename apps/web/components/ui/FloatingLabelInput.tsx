"use client";

import React, { useState, forwardRef } from "react";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

export interface FloatingLabelInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | null;
  helperText?: string;
}

export const FloatingLabelInput = forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ id, label, type = "text", error, helperText, value, onChange, className = "", ...props }, ref) => {
    const [focused, setFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const inputId = id || `input-${label.toLowerCase().replace(/\s+/g, "-")}`;
    const hasValue = value !== undefined && value !== null && String(value).length > 0;
    const isFloating = focused || hasValue;
    const isPassword = type === "password";
    const actualType = isPassword ? (showPassword ? "text" : "password") : type;

    return (
      <div className="w-full space-y-1">
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={actualType}
            value={value}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder=" "
            className={`peer block w-full rounded-control border bg-white px-3.5 pt-5 pb-2 text-sm text-slate-900 transition-all duration-200 focus:outline-none focus:ring-2 min-h-[48px] ${
              error
                ? "border-red-400 focus:border-red-500 focus:ring-red-100"
                : "border-slate-200 focus:border-sky-500 focus:ring-sky-100"
            } ${isPassword ? "pr-11" : ""} ${className}`}
            {...props}
          />

          <label
            htmlFor={inputId}
            className={`pointer-events-none absolute left-3.5 transition-all duration-200 origin-[0] select-none ${
              isFloating
                ? "top-1.5 text-[11px] font-medium"
                : "top-3.5 text-sm font-normal text-slate-400"
            } ${
              error
                ? "text-red-500"
                : focused
                ? "text-sky-600"
                : "text-slate-500"
            }`}
          >
            {label}
          </label>

          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors p-0.5 rounded focus:outline-none"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </div>

        {error && (
          <div className="flex items-center space-x-1.5 text-xs text-red-600 animate-in fade-in duration-150 pl-1 pt-0.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!error && helperText && (
          <p className="text-[11px] text-slate-500 pl-1">{helperText}</p>
        )}
      </div>
    );
  }
);

FloatingLabelInput.displayName = "FloatingLabelInput";
