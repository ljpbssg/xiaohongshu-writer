"use client";

import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type TabKey = "generate" | "mimic" | "hot-topic";

interface ModeTabsProps {
  value: TabKey;
  onValueChange: (value: TabKey) => void;
  disabled?: boolean;
}

const tabs = [
  { key: "generate" as const, label: "✨ 智能生成" },
  { key: "mimic" as const, label: "🎯 爆款仿写" },
  { key: "hot-topic" as const, label: "🔥 蹭热点" },
];

export function ModeTabs({ value, onValueChange, disabled }: ModeTabsProps) {
  return (
    <Tabs
      value={value}
      onValueChange={(v) => onValueChange(v as TabKey)}
      className="w-full"
    >
      <TabsList
        variant="default"
        className="w-full rounded-xl p-1"
        style={{ backgroundColor: "rgba(255,36,66,0.06)" }}
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.key}
            value={tab.key}
            disabled={disabled}
            className={cn(
              "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
              "data-active:bg-white data-active:text-[#FF2442] data-active:shadow-sm",
              "hover:text-[#FF2442]"
            )}
          >
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
