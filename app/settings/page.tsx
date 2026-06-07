"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  Save,
  FlaskConical,
  ArrowLeft,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const STORAGE_KEYS = {
  apiEndpoint: "apiEndpoint",
  apiKey: "apiKey",
  modelName: "modelName",
} as const;

const DEFAULTS: { apiEndpoint: string; apiKey: string; modelName: string } = {
  apiEndpoint: "https://api.deepseek.com/v1",
  apiKey: "",
  modelName: "deepseek-chat",
};

export default function SettingsPage() {
  const router = useRouter();

  const [apiEndpoint, setApiEndpoint] = useState(DEFAULTS.apiEndpoint);
  const [apiKey, setApiKey] = useState(DEFAULTS.apiKey);
  const [modelName, setModelName] = useState(DEFAULTS.modelName);
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // 加载配置
  useEffect(() => {
    setApiEndpoint(
      localStorage.getItem(STORAGE_KEYS.apiEndpoint) || DEFAULTS.apiEndpoint
    );
    setApiKey(localStorage.getItem(STORAGE_KEYS.apiKey) || DEFAULTS.apiKey);
    setModelName(
      localStorage.getItem(STORAGE_KEYS.modelName) || DEFAULTS.modelName
    );
    setLoaded(true);
  }, []);

  // 保存配置
  const handleSave = useCallback(() => {
    setSaving(true);
    try {
      localStorage.setItem(STORAGE_KEYS.apiEndpoint, apiEndpoint.trim());
      localStorage.setItem(STORAGE_KEYS.apiKey, apiKey.trim());
      localStorage.setItem(STORAGE_KEYS.modelName, modelName.trim());
      toast.success("配置已保存");
    } catch {
      toast.error("保存失败，请重试");
    } finally {
      setSaving(false);
    }
  }, [apiEndpoint, apiKey, modelName]);

  // 测试连接
  const handleTest = useCallback(async () => {
    if (!apiKey.trim()) {
      toast.error("请先填写 API Key");
      return;
    }

    setTesting(true);
    try {
      const endpoint = apiEndpoint.trim() || DEFAULTS.apiEndpoint;
      const url = endpoint.endsWith("/chat/completions")
        ? endpoint
        : `${endpoint.replace(/\/$/, "")}/chat/completions`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: modelName.trim() || DEFAULTS.modelName,
          messages: [{ role: "user", content: "hi" }],
          max_tokens: 10,
        }),
      });

      if (response.ok) {
        toast.success("连接成功！API 可正常使用");
      } else {
        const errorData = await response.json().catch(() => null);
        const msg =
          errorData?.error?.message || `HTTP ${response.status}`;
        toast.error(`连接失败: ${msg}`);
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "未知错误";
      toast.error(`连接失败: ${message}`);
    } finally {
      setTesting(false);
    }
  }, [apiEndpoint, apiKey, modelName]);

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#FFF5F5" }}>
        <p className="text-muted-foreground text-sm">加载中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "#FFF5F5" }}>
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
        {/* 返回按钮 */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
          返回首页
        </button>

        {/* 安全提示 */}
        <Card className="border-[#FFE4E6] bg-white shadow-sm">
          <CardContent className="py-3">
            <div className="flex items-start gap-2">
              <Shield className="size-4 text-[#FF2442] shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                你的 API Key 仅保存在浏览器本地存储（localStorage），不会上传到任何服务器。建议使用专门的 API Key，并设置合理的额度限制。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* API 设置表单 */}
        <Card className="shadow-lg shadow-[#FF2442]/5 border-[#FFE4E6]">
          <CardHeader>
            <CardTitle className="text-xl">API 设置</CardTitle>
            <CardDescription>
              配置 DeepSeek API 连接信息，用于生成小红书文案
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* API 接口地址 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                API 接口地址
              </label>
              <Input
                placeholder="https://api.deepseek.com/v1"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                支持任意兼容 OpenAI 接口格式的 API 地址
              </p>
            </div>

            {/* API Key */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                API Key
              </label>
              <div className="relative">
                <Input
                  type={showKey ? "text" : "password"}
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="h-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showKey ? "隐藏 API Key" : "显示 API Key"}
                >
                  {showKey ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {/* 模型名称 */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                模型名称
              </label>
              <Input
                placeholder="deepseek-chat"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                className="h-10"
              />
              <p className="text-xs text-muted-foreground">
                默认 deepseek-chat，也可使用 deepseek-reasoner 等其他模型
              </p>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 h-10"
                style={{
                  backgroundColor: "#FF2442",
                  borderColor: "#FF2442",
                }}
              >
                <Save className="size-4" />
                {saving ? "保存中..." : "保存配置"}
              </Button>
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={testing}
                className="flex-1 h-10"
                style={{ borderColor: "#FF2442", color: "#FF2442" }}
              >
                <FlaskConical className="size-4" />
                {testing ? "测试中..." : "测试连接"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 使用说明 */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">📝 使用说明</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="space-y-1">
              <p className="font-medium text-foreground">1. 获取 API Key</p>
              <p>
                前往{" "}
                <a
                  href="https://platform.deepseek.com/api_keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#FF2442] underline underline-offset-2"
                >
                  DeepSeek 开放平台
                </a>{" "}
                注册账号并创建 API Key
              </p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">2. 填入配置</p>
              <p>在上方表单中填入 API 接口地址、Key 和模型名称</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">3. 测试连接</p>
              <p>点击「测试连接」确认配置正确，然后保存</p>
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">4. 开始生成</p>
              <p>返回首页，填写产品信息，一键生成小红书文案！</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
