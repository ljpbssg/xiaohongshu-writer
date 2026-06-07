"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";

export const STYLE_OPTIONS = [
  { value: "种草推荐", label: "🌿 种草推荐" },
  { value: "专业测评", label: "📊 专业测评" },
  { value: "故事分享", label: "📖 故事分享" },
  { value: "干货科普", label: "🧪 干货科普" },
  { value: "好物开箱", label: "📦 好物开箱" },
  { value: "前后对比", label: "🔄 前后对比" },
  { value: "成分解析", label: "🔬 成分解析" },
  { value: "省钱攻略", label: "💰 省钱攻略" },
] as const;

export const COUNT_OPTIONS = [1, 2, 3, 4, 5] as const;

export interface FormData {
  productName: string;
  sellingPoints: string;
  targetAudience: string;
  style: string;
  count: number;
}

interface GenerateFormProps {
  data: FormData;
  onChange: (data: FormData) => void;
  onSubmit: () => void;
  loading: boolean;
}

export function GenerateForm({ data, onChange, onSubmit, loading }: GenerateFormProps) {
  const update = (partial: Partial<FormData>) => {
    onChange({ ...data, ...partial });
  };

  const isValid = data.productName.trim() && data.sellingPoints.trim();

  return (
    <Card className="shadow-lg shadow-[#FF2442]/5 border-[#FFE4E6]">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Sparkles className="size-5 text-[#FF2442]" />
          填写产品信息
        </CardTitle>
        <CardDescription>
          输入产品核心信息，AI 帮你一键生成小红书风格爆款文案
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 产品名称 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            产品名称 <span className="text-[#FF2442]">*</span>
          </label>
          <Input
            placeholder="例如：氨基酸洁面乳"
            value={data.productName}
            onChange={(e) => update({ productName: e.target.value })}
            disabled={loading}
            className="h-10"
          />
        </div>

        {/* 产品卖点 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            产品卖点 <span className="text-[#FF2442]">*</span>
          </label>
          <Textarea
            placeholder="例如：温和不刺激、泡沫丰富、适合敏感肌"
            value={data.sellingPoints}
            onChange={(e) => update({ sellingPoints: e.target.value })}
            disabled={loading}
            rows={3}
            className="min-h-20"
          />
        </div>

        {/* 目标受众 */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            目标受众 <span className="text-xs text-muted-foreground">（选填）</span>
          </label>
          <Input
            placeholder="例如：25-35岁女性"
            value={data.targetAudience}
            onChange={(e) => update({ targetAudience: e.target.value })}
            disabled={loading}
            className="h-10"
          />
        </div>

        {/* 文案风格 & 生成数量 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">文案风格</label>
            <Select
              value={data.style}
              onValueChange={(value) => update({ style: value ?? "种草推荐" })}
              disabled={loading}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STYLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">生成数量</label>
            <Select
              value={String(data.count)}
              onValueChange={(value) => update({ count: Number(value) })}
              disabled={loading}
            >
              <SelectTrigger className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COUNT_OPTIONS.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n} 条
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 生成按钮 */}
        {loading ? (
          <Skeleton className="h-12 w-full rounded-lg" />
        ) : (
          <Button
            onClick={onSubmit}
            disabled={!isValid}
            className="w-full h-12 text-base font-semibold"
            style={{
              backgroundColor: isValid ? "#FF2442" : undefined,
              borderColor: "#FF2442",
            }}
          >
            <Sparkles className="size-4" />
            生成文案
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
