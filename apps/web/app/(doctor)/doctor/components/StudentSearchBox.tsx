"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, User, Check, AlertCircle } from "lucide-react";
import { DoctorService } from "@/lib/doctor/service";
import { StudentSearchResult } from "@/lib/doctor/types";

interface StudentSearchBoxProps {
  onSelectStudent: (rollNumber: string) => void;
  isLoading?: boolean;
}

export function StudentSearchBox({
  onSelectStudent,
  isLoading = false,
}: StudentSearchBoxProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Autocomplete fetch as doctor types
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      const searchResults = await DoctorService.searchStudents(query);
      setResults(searchResults);
      setIsOpen(searchResults.length > 0);
      setSelectedIndex(-1);
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (rollNumber: string) => {
    setIsOpen(false);
    setQuery("");
    onSelectStudent(rollNumber);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < results.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && results[selectedIndex]) {
        handleSelect(results[selectedIndex].roll_number);
      } else if (query.trim()) {
        handleSelect(query.trim());
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative flex items-center">
        <Search className="pointer-events-none absolute left-4 h-5 w-5 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Type student Roll Number (e.g. 2200290120019) or Name, then press Enter..."
          className="h-14 w-full rounded-12 border border-doctor-border bg-white pl-12 pr-28 text-base text-doctor-navy shadow-sm transition-all placeholder:text-slate-400 focus:border-doctor-blue focus:outline-none focus:ring-2 focus:ring-doctor-blue/20"
        />
        <div className="absolute right-3 flex items-center space-x-2">
          {isLoading ? (
            <span className="flex items-center text-xs text-doctor-blue animate-pulse font-medium">
              Loading...
            </span>
          ) : (
            <kbd className="hidden rounded bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 sm:inline-block border border-slate-200">
              Enter ↵
            </kbd>
          )}
        </div>
      </div>

      {/* Autocomplete Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute left-0 right-0 z-50 mt-1 max-h-72 overflow-y-auto rounded-12 border border-slate-200 bg-white shadow-xl">
          <div className="border-b border-slate-100 px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Matching Students ({results.length})
          </div>
          {results.map((student, idx) => (
            <button
              key={student.id}
              type="button"
              onClick={() => handleSelect(student.roll_number)}
              onMouseEnter={() => setSelectedIndex(idx)}
              className={`flex w-full items-center justify-between px-4 py-3 text-left transition-colors ${
                selectedIndex === idx
                  ? "bg-doctor-panel text-doctor-blue"
                  : "hover:bg-slate-50 text-doctor-navy"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-doctor-blue font-bold text-xs">
                  {student.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-semibold">{student.name}</div>
                  <div className="text-xs text-slate-500">
                    Roll: <span className="font-mono font-medium">{student.roll_number}</span> &bull; {student.branch} (Year {student.year})
                  </div>
                </div>
              </div>
              <span className="text-xs text-slate-400 font-medium">Select ↵</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
