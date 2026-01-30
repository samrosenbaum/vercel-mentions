"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FilterBarProps {
  platform: string;
  keyword: string;
  onPlatformChange: (value: string) => void;
  onKeywordChange: (value: string) => void;
  platforms: string[];
}

export function FilterBar({
  platform,
  keyword,
  onPlatformChange,
  onKeywordChange,
  platforms,
}: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-4 items-center">
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Platform</label>
        <Select value={platform} onValueChange={onPlatformChange}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="All platforms" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All platforms</SelectItem>
            {platforms.map((p) => (
              <SelectItem key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <label className="text-sm font-medium">Keyword</label>
        <Select value={keyword} onValueChange={onKeywordChange}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="All keywords" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="vercel">Vercel</SelectItem>
            <SelectItem value="v0">v0</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
