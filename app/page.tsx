"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Sparkles, Settings, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/copy-button";
import { ModeTabs, type TabKey } from "@/components/mode-tabs";
import { GenerateForm, type FormData } from "@/components/generate-form";
import { HotNoteAnalyzer } from "@/components/hot-note-analyzer";
import { HotTopicPicker } from "@/components/hot-topic-picker";
import {
  generateCopywriting,
  type GenerateResult,
  MissingApiKeyError,
} from "@/lib/api";

function hasApiKey(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("apiKey");
}

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabKey>("generate");

  // Tab 1: Smart Generate state
  const [formData, setFormData] = useState<FormData>({
    productName: "",
    sellingPoints: "",
    targetAudience: "",
    style: "种草推荐",
    count: 3,
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GenerateResult[]>([]);
  const [showApiHint, setShowApiHint] = useState(false);

  const handleGenerate = useCallback(async () => {
    if (!hasApiKey()) {
      setShowApiHint(true);
      toast.error("请先配置 API Key");
      return;
    }
    setShowApiHint(false);
    setLoading(true);
    try {
      const data = await generateCopywriting({
        productName: formData.productName.trim(),
        sellingPoints: formData.sellingPoints.trim(),
        targetAudience: formData.targetAudience.trim() || undefined,
        style: formData.style,
        count: formData.count,
      });
      setResults(data);
      if (data.length === 0) {
        toast.info("未生成文案，请检查产品信息后重试");
      } else {
        toast.success(`成功生成 ${data.length} 条文案`);
      }
    } catch (err) {
      if (err instanceof MissingApiKeyError) {
        setShowApiHint(true);
        toast.error("请先配置 API Key");
      } else {
        const message =
          err instanceof Error ? err.message : "生成失败，请稍后重试";
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  }, [formData]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FFF5F5" }}>
      {/* Hero 区域 */}
      <section className="relative overflow-hidden px-4 pt-12 pb-8 text-center">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(255,36,66,0.08) 0%, transparent 70%)",
          }}
        />
        <h1 className="relative text-3xl sm:text-4xl font-extrabold tracking-tight">
          <span
            className="bg-clip-text text-transparent"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #FF2442 0%, #FF6B81 50%, #FF2442 100%)",
            }}
          >
            ✨ 小红书文案生成器
          </span>
        </h1>
        <p className="relative mt-3 text-base text-muted-foreground max-w-md mx-auto">
          不仅仅是 AI 生成——拆解爆款公式，蹭对热点，让你的种草文案自带流量
        </p>

        {/* API Key 安全提示 */}
        <p className="relative mt-3 text-xs text-muted-foreground/70 flex items-center justify-center gap-1">
          🔒 你的 API Key 仅保存在浏览器本地，不会上传到任何服务器
        </p>
      </section>

      {/* 内容区 */}
      <main className="mx-auto max-w-2xl px-4 pb-24 space-y-6">
        {/* 未配置 API Key 提示 */}
        {showApiHint && (
          <Card className="border-[#FFE4E6] bg-white shadow-lg shadow-[#FF2442]/5">
            <CardContent className="py-4">
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">🔑</span>
                <div className="flex-1 space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    尚未配置 API Key
                  </p>
                  <p className="text-xs text-muted-foreground">
                    请先前往设置页面配置你的 DeepSeek API Key，即可开始生成小红书文案。
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/settings")}
                    className="gap-1"
                    style={{ borderColor: "#FF2442", color: "#FF2442" }}
                  >
                    <Settings className="size-3" />
                    前往设置
                    <ArrowRight className="size-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tab 切换 */}
        <ModeTabs
          value={activeTab}
          onValueChange={(tab) => {
            setActiveTab(tab);
            // Clear results when switching tabs for cleaner UX
            setResults([]);
          }}
          disabled={loading}
        />

        {/* Tab 1: 智能生成 */}
        {activeTab === "generate" && (
          <div className="space-y-6">
            <GenerateForm
              data={formData}
              onChange={setFormData}
              onSubmit={handleGenerate}
              loading={loading}
            />

            {/* Loading */}
            {loading && (
              <div className="space-y-4">
                <p className="text-center text-sm text-muted-foreground">
                  🤖 AI 正在为你生成文案，请稍候...
                </p>
                {Array.from({ length: formData.count }).map((_, i) => (
                  <Card key={i} className="shadow-sm">
                    <CardContent className="py-4 space-y-3">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-5/6" />
                      <div className="flex gap-2 pt-1">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                        <Skeleton className="h-5 w-14 rounded-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Results */}
            {!loading && results.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Sparkles className="size-5 text-[#FF2442]" />
                  生成结果
                </h2>
                <div className="grid gap-4">
                  {results.map((item, index) => (
                    <Card
                      key={index}
                      className="shadow-md shadow-[#FF2442]/5 border-[#FFE4E6] bg-white hover:shadow-lg hover:shadow-[#FF2442]/8 transition-shadow"
                    >
                      <CardContent className="py-4 space-y-3">
                        <div className="relative">
                          <div className="absolute top-0 right-0">
                            <CopyButton
                              text={`${item.content}\n\n${item.hashtags.join(" ")}`}
                            />
                          </div>
                          <div className="text-sm text-foreground leading-relaxed whitespace-pre-wrap pr-8">
                            {item.content}
                          </div>
                        </div>
                        {item.hashtags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#FFE4E6]/50">
                            {item.hashtags.map((tag, ti) => (
                              <span
                                key={ti}
                                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                                style={{
                                  backgroundColor: "rgba(255,36,66,0.08)",
                                  color: "#FF2442",
                                }}
                              >
                                {tag.startsWith("#") ? tag : `#${tag}`}
                              </span>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* Tab 2: 爆款仿写 */}
        {activeTab === "mimic" && <HotNoteAnalyzer />}

        {/* Tab 3: 蹭热点 */}
        {activeTab === "hot-topic" && <HotTopicPicker />}
      </main>
    </div>
  );
}
