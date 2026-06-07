"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Sparkles, Flame } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/copy-button";
import {
  generateHotTopicCopywriting,
  type GenerateResult,
  MissingApiKeyError,
} from "@/lib/api";

function hasApiKey(): boolean {
  if (typeof window === "undefined") return false;
  return !!localStorage.getItem("apiKey");
}

const PRESET_TOPICS = [
  "618必买清单",
  "换季护肤",
  "平替好物",
  "学生党必备",
  "打工人神器",
  "懒人福音",
  "约会必备",
  "送礼推荐",
  "宿舍好物",
  "早八人",
];

export function HotTopicPicker() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState("");
  const [productName, setProductName] = useState("");
  const [sellingPoints, setSellingPoints] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GenerateResult[]>([]);

  const toggleTopic = useCallback((topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic)
        ? prev.filter((t) => t !== topic)
        : [...prev, topic]
    );
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!hasApiKey()) {
      toast.error("请先在设置页面配置 API Key");
      return;
    }
    if (!productName.trim() || !sellingPoints.trim()) {
      toast.error("请填写产品名称和卖点");
      return;
    }
    if (selectedTopics.length === 0 && !customTopic.trim()) {
      toast.error("请至少选择一个热点话题或输入自定义热点");
      return;
    }

    setLoading(true);
    setResults([]);
    try {
      const data = await generateHotTopicCopywriting(
        productName.trim(),
        sellingPoints.trim(),
        selectedTopics,
        customTopic.trim()
      );
      setResults(data);
      if (data.length === 0) {
        toast.info("未生成文案，请检查后重试");
      } else {
        toast.success(`成功生成 ${data.length} 条热点文案`);
      }
    } catch (err) {
      if (err instanceof MissingApiKeyError) {
        toast.error("请先配置 API Key");
      } else {
        const message = err instanceof Error ? err.message : "生成失败，请稍后重试";
        toast.error(message);
      }
    } finally {
      setLoading(false);
    }
  }, [selectedTopics, customTopic, productName, sellingPoints]);

  return (
    <div className="space-y-5">
      {/* Hot Topic Form */}
      <Card className="shadow-lg shadow-[#FF2442]/5 border-[#FFE4E6]">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="size-5 text-[#FF2442]" />
            蹭热点生成
          </CardTitle>
          <CardDescription>
            选择当前热点话题，让产品自然融入热门讨论，获取更多流量
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Preset Topics */}
          <div className="space-y-2.5">
            <label className="text-sm font-medium text-foreground">
              🔥 热门话题 <span className="text-xs text-muted-foreground">（可多选）</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {PRESET_TOPICS.map((topic) => {
                const isSelected = selectedTopics.includes(topic);
                return (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => toggleTopic(topic)}
                    disabled={loading}
                    className={`inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${
                      isSelected
                        ? "text-white shadow-md shadow-[#FF2442]/25 scale-105"
                        : "text-muted-foreground bg-muted hover:bg-[#FFE4E6] hover:text-[#FF2442]"
                    }`}
                    style={
                      isSelected
                        ? { backgroundColor: "#FF2442" }
                        : undefined
                    }
                  >
                    {isSelected && <span className="text-xs">✓</span>}
                    {topic}
                  </button>
                );
              })}
            </div>
            {selectedTopics.length > 0 && (
              <p className="text-xs text-[#FF2442]">
                已选择 {selectedTopics.length} 个热点话题
              </p>
            )}
          </div>

          {/* Custom Topic */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              ✍️ 自定义热点 <span className="text-xs text-muted-foreground">（选填）</span>
            </label>
            <Textarea
              placeholder="输入最近流行的热点事件、电视剧、流行语...&#10;例如：《繁花》同款穿搭、Citywalk 路线推荐..."
              value={customTopic}
              onChange={(e) => setCustomTopic(e.target.value)}
              disabled={loading}
              rows={2}
              className="min-h-16 resize-y"
            />
          </div>

          {/* Product Info */}
          <div className="border-t border-[#FFE4E6] pt-4 space-y-4">
            <p className="text-sm font-medium text-foreground">
              📦 产品信息
            </p>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                产品名称 <span className="text-[#FF2442]">*</span>
              </label>
              <Input
                placeholder="例如：氨基酸洁面乳"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                disabled={loading}
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
                disabled={loading}
                rows={2}
                className="min-h-16"
              />
            </div>
          </div>

          {/* Generate Button */}
          {loading ? (
            <Skeleton className="h-12 w-full rounded-lg" />
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={
                !productName.trim() ||
                !sellingPoints.trim() ||
                (selectedTopics.length === 0 && !customTopic.trim())
              }
              className="w-full h-12 text-base font-semibold"
              style={{
                backgroundColor:
                  productName.trim() &&
                  sellingPoints.trim() &&
                  (selectedTopics.length > 0 || customTopic.trim())
                    ? "#FF2442"
                    : undefined,
                borderColor: "#FF2442",
              }}
            >
              <Flame className="size-4" />
              生成热点文案
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            🔥 AI 正在结合热点创作文案，请稍候...
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
      {!loading && results.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="size-5 text-[#FF2442]" />
            热点文案结果
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
