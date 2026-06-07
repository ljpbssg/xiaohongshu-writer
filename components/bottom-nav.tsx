"use client";

import { usePathname, useRouter } from "next/navigation";
import { Home, Settings } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();

  const isHome = pathname === "/";
  const isSettings = pathname === "/settings";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex max-w-2xl">
        <button
          onClick={() => router.push("/")}
          className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
            isHome ? "text-[#FF2442]" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Home className="size-5" />
          <span>首页</span>
        </button>
        <button
          onClick={() => router.push("/settings")}
          className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors ${
            isSettings ? "text-[#FF2442]" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Settings className="size-5" />
          <span>设置</span>
        </button>
      </div>
    </nav>
  );
}
