"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Sparkles, Search, Copy, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/copy-button";
import {
  analyzeHotNote,
  mimicCopywriting,
  type HotNoteAnalysis,
  type GenerateResult,
  MissingApiKeyError,
} from "@/lib/api";

function hasApiKey(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("apiKey");
}

const ANALYSIS_LABELS: { key: keyof HotNoteAnalysis; icon: string; label: string }[] = [
  { key: "titleFormula", icon: "📝", label: "标题公式" },
  { key: "hookMethod", icon: "🪝", label: "开头钩子" },
  { key: "bodyStructure", icon: "🏗️", label: "正文结构" },
  { key: "emojiStyle", icon: "😊", label: "Emoji 风格" },
  { key: "hashtagStrategy", icon: "#️⃣", label: "标签策略" },
  { key: "interactionMethod", icon: "💬", label: "互动引导" },
];

export function HotNoteAnalyzer() {
  // Step 1 state
  const [noteContent, setNoteContent] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<HotNoteAnalysis | null>(null);
  const [currentStep, setCurrentStep] = useState(1);

  // Step 2 state
  const [productName, setProductName] = useState("");
  const [sellingPoints, setSellingPoints] = useState("");
  const [generating, setGenerating] = useState(false);
  const [results, setResults] = useState<GenerateResult[]>([]);

  // Step 1: Analyze
  const handleAnalyze = useCallback(async () => {
    if (!hasApiKey()) {
      toast.error("请先在设置页面配置 API Key");
      return;
    }
    if (!noteContent.trim()) {
      toast.error("请先粘贴爆款笔记内容");
      return;
    }
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const result = await analyzeHotNote(noteContent.trim());
      setAnalysis(result);
      setCurrentStep(2);
      toast.success("分析完成！已提取爆款公式");
    } catch (err) {
      if (err instanceof MissingApiKeyError) {
        toast.error("请先配置 API Key");
      } else {
        const message = err instanceof Error ? err.message : "分析失败，请稍后重试";
        toast.error(message);
      }
    } finally {
      setAnalyzing(false);
    }
  }, [noteContent]);

  // Step 2: Generate mimic
  const handleGenerate = useCallback(async () => {
    if (!hasApiKey()) {
      toast.error("请先在设置页面配置 API Key");
      return;
    }
    if (!productName.trim() || !sellingPoints.trim()) {
      toast.error("请填写产品名称和卖点");
      return;
    }
    if (!analysis) {
      toast.error("请先完成爆款分析");
      return;
    }
    setGenerating(true);
    setResults([]);
    try {
      const data = await mimicCopywriting(
        analysis,
        productName.trim(),
        sellingPoints.trim()
      );
      setResults(data);
      if (data.length === 0) {
        toast.info("未生成文案，请检查后重试");
      } else {
        toast.success(`成功仿写 ${data.length} 条文案`);
      }
    } catch (err) {
      if (err instanceof MissingApiKeyError) {
        toast.error("请先配置 API Key");
      } else {
        const message = err instanceof Error ? err.message : "生成失败，请稍后重试";
        toast.error(message);
      }
    } finally {
      setGenerating(false);
    }
  }, [analysis, productName, sellingPoints]);

  const handleReset = useCallback(() => {
    setNoteContent("");
    setAnalysis(null);
    setCurrentStep(1);
    setProductName("");
    setSellingPoints("");
    setResults([]);
  }, []);

  return (
    <div className="space-y-5">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-2 py-2">
        {[1, 2].map((step) => (
          <div key={step} className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center size-8 rounded-full text-sm font-bold transition-all duration-300 ${
                currentStep >= step
                  ? "text-white"
                  : "text-muted-foreground bg-muted"
              }`}
              style={
                currentStep >= step
                  ? { backgroundColor: "#FF2442" }
                  : undefined
              }
            >
              {currentStep > step ? (
                <CheckCircle2 className="size-4" />
              ) : (
                step
              )}
            </div>
            <span
              className={`text-sm font-medium transition-colors ${
                currentStep >= step ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {step === 1 ? "分析爆款" : "仿写生成"}
            </span>
            {step === 1 && (
              <ArrowRight className="size-4 text-muted-foreground mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Paste & Analyze */}
      {currentStep === 1 && (
        <Card className="shadow-lg shadow-[#FF2442]/5 border-[#FFE4E6]">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="size-5 text-[#FF2442]" />
              第一步：分析爆款笔记
            </CardTitle>
            <CardDescription>
              粘贴一篇小红书爆款笔记，AI 将自动拆解其写作公式和结构套路
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="粘贴一篇小红书爆款笔记的完整内容...&#10;（标题+正文+标签都要）&#10;&#10;例如：&#10;标题：干敏皮救星！这瓶洗面奶我真的会回购一辈子&#10;正文：有没有姐妹和我一样..."
              value={noteContent}
              onChange={(e) => setNoteContent(e.target.value)}
              disabled={analyzing}
              rows={10}
              className="min-h-40 resize-y"
            />
            {analyzing ? (
              <Skeleton className="h-12 w-full rounded-lg" />
            ) : (
              <Button
                onClick={handleAnalyze}
                disabled={!noteContent.trim()}
                className="w-full h-12 text-base font-semibold"
                style={{
                  backgroundColor: noteContent.trim() ? "#FF2442" : undefined,
                  borderColor: "#FF2442",
                }}
              >
                <Search className="size-4" />
                分析结构
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Analysis Loading */}
      {analyzing && (
        <Card className="shadow-sm border-[#FFE4E6]">
          <CardContent className="py-6 space-y-4">
            <p className="text-center text-sm text-muted-foreground">
              🔍 AI 正在拆解爆款笔记结构，请稍候...
            </p>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Analysis Result */}
      {analysis && (
        <Card className="shadow-md shadow-[#FF2442]/5 border-[#FFE4E6] bg-white">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="size-5 text-[#FF2442]" />
                爆款公式分析
              </CardTitle>
              <button
                onClick={handleReset}
                className="text-xs text-muted-foreground hover:text-[#FF2442] transition-colors"
              >
                重新分析
              </button>
            </div>
            <CardDescription>
              以下是该爆款笔记的 6 大核心写作维度
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {ANALYSIS_LABELS.map(({ key, icon, label }) => (
                <div
                  key={key}
                  className="rounded-xl border border-[#FFE4E6] p-3.5 space-y-1.5 bg-[#FFF5F5]/50"
                >
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                    <span>{icon}</span>
                    <span>{label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {analysis[key]}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Mimic Generate */}
      {currentStep === 2 && analysis && (
        <Card className="shadow-lg shadow-[#FF2442]/5 border-[#FFE4E6]">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Copy className="size-5 text-[#FF2442]" />
              第二步：基于公式仿写
            </CardTitle>
            <CardDescription>
              输入你的产品信息，AI 将用同样的爆款套路为你创作文案
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                产品名称 <span className="text-[#FF2442]">*</span>
              </label>
              <Input
                placeholder="例如：氨基酸洁面乳"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                disabled={generating}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                产品卖点 <span className="text-[#FF2442]">*</span>
              </label>
              <Textarea
                placeholder="例如：温和不刺激、泡沫丰富、适合敏感肌"
                value={sellingPoints}
                onChange={(e) => setSellingPoints(e.target.value)}
                disabled={generating}
                rows={2}
                className="min-h-16"
              />
            </div>

            {generating ? (
              <Skeleton className="h-12 w-full rounded-lg" />
            ) : (
              <Button
                onClick={handleGenerate}
                disabled={!productName.trim() || !sellingPoints.trim()}
                className="w-full h-12 text-base font-semibold"
                style={{
                  backgroundColor:
                    productName.trim() && sellingPoints.trim()
                      ? "#FF2442"
                      : undefined,
                  borderColor: "#FF2442",
                }}
              >
                <Sparkles className="size-4" />
                仿写生成
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Generating Loading */}
      {generating && (
        <div className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            ✍️ AI 正在仿写文案，请稍候...
          </p>
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="shadow-sm">
              <CardContent className="py-4 space-y-3">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-5/6" />
                <div className="flex gap-2 pt-1">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Results */}
      {!generating && results.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="size-5 text-[#FF2442]" />
            仿写结果
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
  );
}
