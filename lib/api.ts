export interface GenerateParams {
  productName: string;
  sellingPoints: string;
  targetAudience?: string;
  style: string;
  count: number;
}

export interface GenerateResult {
  content: string;
  hashtags: string[];
}

export interface HotNoteAnalysis {
  titleFormula: string;
  hookMethod: string;
  bodyStructure: string;
  emojiStyle: string;
  hashtagStrategy: string;
  interactionMethod: string;
}

export class MissingApiKeyError extends Error {
  constructor() {
    super("请先在设置页面配置 API Key");
    this.name = "MissingApiKeyError";
  }
}

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

interface Config {
  apiEndpoint: string;
  apiKey: string;
  modelName: string;
}

function getConfig(): Config {
  if (typeof window === "undefined") {
    return {
      apiEndpoint: "https://api.deepseek.com/v1",
      apiKey: "",
      modelName: "deepseek-chat",
    };
  }
  return {
    apiEndpoint:
      localStorage.getItem("apiEndpoint") || "https://api.deepseek.com/v1",
    apiKey: localStorage.getItem("apiKey") || "",
    modelName: localStorage.getItem("modelName") || "deepseek-chat",
  };
}

function buildPrompt(params: GenerateParams): string {
  const audienceLine = params.targetAudience
    ? `目标受众：${params.targetAudience}`
    : "";

  return `请为以下产品生成${params.count}条小红书风格的种草文案。

产品名称：${params.productName}
产品卖点：${params.sellingPoints}
${audienceLine}
文案风格：${params.style}

要求：
1. 每条文案需要有吸引眼球的标题和详细的种草内容
2. 使用小红书常见的表达方式，包含适当的 emoji
3. 文案要有感染力，突出产品卖点，激发购买欲望
4. 每条文案末尾附带 3-5 个相关的话题标签

请严格按照以下 JSON 格式返回（不要包含任何其他内容）：
[
  {
    "content": "文案完整内容（包含标题和正文，使用 \\n 换行）",
    "hashtags": ["#标签1", "#标签2", "#标签3"]
  }
]`;
}

function parseResponse(raw: string): GenerateResult[] {
  // Try to extract JSON from the response
  let jsonStr = raw.trim();

  // Remove markdown code fences if present
  const fenceMatch = jsonStr.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
  if (fenceMatch) {
    jsonStr = fenceMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) {
      throw new Error("API 返回格式不正确，期望数组");
    }
    return parsed.map((item: { content: string; hashtags: string[] }) => ({
      content: String(item.content || ""),
      hashtags: Array.isArray(item.hashtags) ? item.hashtags : [],
    }));
  } catch (e) {
    if (e instanceof SyntaxError) {
      // If JSON parsing fails, return raw text as single result
      return [
        {
          content: raw,
          hashtags: [],
        },
      ];
    }
    throw e;
  }
}

export async function generateCopywriting(
  params: GenerateParams
): Promise<GenerateResult[]> {
  const { apiEndpoint, apiKey, modelName } = getConfig();

  if (!apiKey) {
    throw new MissingApiKeyError();
  }

  const prompt = buildPrompt(params);

  const url = apiEndpoint.endsWith("/chat/completions")
    ? apiEndpoint
    : `${apiEndpoint.replace(/\/$/, "")}/chat/completions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        {
          role: "system",
          content:
            "你是一个专业的小红书种草文案生成专家。你擅长用温暖、真实、有感染力的语言撰写产品推荐文案。你的回复只包含 JSON 数据，不包含任何其他内容。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    let errorMsg = "";
    try {
      const errorBody = await response.json();
      errorMsg =
        errorBody.error?.message || errorBody.message || JSON.stringify(errorBody);
    } catch {
      errorMsg = await response.text();
    }
    throw new ApiRequestError(
      response.status,
      `API 请求失败 (${response.status}): ${errorMsg || "未知错误"}`
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("API 返回数据格式异常，未找到有效内容");
  }

  return parseResponse(content);
}

// ============ Tab 2: 爆款仿写 ============

function buildAnalyzePrompt(noteContent: string): string {
  return `请分析以下这篇小红书爆款笔记的结构特点，从以下六个维度进行剖析：

笔记内容：
"""
${noteContent}
"""

请按以下维度分析：
1. 标题公式：属于以下哪种类型？（数字型/悬念型/痛点型/反常识型/对比型/人群标签型/清单型/故事型）
2. 开头钩子：用了什么方式吸引读者？（痛点切入/场景代入/数据冲击/提问引入）
3. 正文结构：整体组织方式是什么？（总分总/清单式/故事线/对比式）
4. emoji 使用：密度和风格如何？（高频/中频/低频，俏皮/简约/无emoji）
5. 话题标签策略：标签选择有什么特点？
6. 互动引导方式：如何引导用户互动？（提问/投票/评论区征集/无引导）

请严格按照以下 JSON 格式返回（不要包含任何其他内容）：
{
  "titleFormula": "简短描述标题公式类型及特征",
  "hookMethod": "简短描述开头钩子方式",
  "bodyStructure": "简短描述正文结构",
  "emojiStyle": "简短描述emoji使用风格",
  "hashtagStrategy": "简短描述标签策略",
  "interactionMethod": "简短描述互动引导方式"
}`;
}

function buildMimicPrompt(
  analysis: HotNoteAnalysis,
  productName: string,
  sellingPoints: string
): string {
  return `请根据以下分析出的爆款笔记结构公式，为新产品仿写 3 条小红书文案。

【爆款公式分析】
- 标题公式：${analysis.titleFormula}
- 开头钩子：${analysis.hookMethod}
- 正文结构：${analysis.bodyStructure}
- emoji 风格：${analysis.emojiStyle}
- 标签策略：${analysis.hashtagStrategy}
- 互动引导：${analysis.interactionMethod}

【你的产品】
- 产品名称：${productName}
- 产品卖点：${sellingPoints}

要求：
1. 严格套用上述爆款公式的结构和风格
2. 每条文案需要有吸引眼球的标题和详细的种草内容
3. 使用与爆款相似的 emoji 密度和风格
4. 互动引导方式要与爆款一致
5. 标签策略要模仿爆款
6. 每条文案末尾附带 3-5 个相关的话题标签

请严格按照以下 JSON 格式返回（不要包含任何其他内容）：
[
  {
    "content": "文案完整内容（包含标题和正文，使用 \\n 换行）",
    "hashtags": ["#标签1", "#标签2", "#标签3"]
  }
]`;
}

export async function analyzeHotNote(
  noteContent: string
): Promise<HotNoteAnalysis> {
  const { apiEndpoint, apiKey, modelName } = getConfig();

  if (!apiKey) {
    throw new MissingApiKeyError();
  }

  const prompt = buildAnalyzePrompt(noteContent);

  const url = apiEndpoint.endsWith("/chat/completions")
    ? apiEndpoint
    : `${apiEndpoint.replace(/\/$/, "")}/chat/completions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        {
          role: "system",
          content:
            "你是一个专业的小红书内容分析师。你擅长拆解爆款笔记的结构和写作套路。你的回复只包含 JSON 数据，不包含任何其他内容。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 2048,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    let errorMsg = "";
    try {
      const errorBody = await response.json();
      errorMsg =
        errorBody.error?.message || errorBody.message || JSON.stringify(errorBody);
    } catch {
      errorMsg = await response.text();
    }
    throw new ApiRequestError(
      response.status,
      `API 请求失败 (${response.status}): ${errorMsg || "未知错误"}`
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("API 返回数据格式异常，未找到有效内容");
  }

  try {
    const parsed = JSON.parse(content);
    return {
      titleFormula: String(parsed.titleFormula || ""),
      hookMethod: String(parsed.hookMethod || ""),
      bodyStructure: String(parsed.bodyStructure || ""),
      emojiStyle: String(parsed.emojiStyle || ""),
      hashtagStrategy: String(parsed.hashtagStrategy || ""),
      interactionMethod: String(parsed.interactionMethod || ""),
    };
  } catch {
    throw new Error("解析分析结果失败，请重试");
  }
}

export async function mimicCopywriting(
  analysis: HotNoteAnalysis,
  productName: string,
  sellingPoints: string
): Promise<GenerateResult[]> {
  const { apiEndpoint, apiKey, modelName } = getConfig();

  if (!apiKey) {
    throw new MissingApiKeyError();
  }

  const prompt = buildMimicPrompt(analysis, productName, sellingPoints);

  const url = apiEndpoint.endsWith("/chat/completions")
    ? apiEndpoint
    : `${apiEndpoint.replace(/\/$/, "")}/chat/completions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        {
          role: "system",
          content:
            "你是一个专业的小红书种草文案生成专家。你擅长模仿爆款笔记的写作套路来创作新文案。你的回复只包含 JSON 数据，不包含任何其他内容。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    let errorMsg = "";
    try {
      const errorBody = await response.json();
      errorMsg =
        errorBody.error?.message || errorBody.message || JSON.stringify(errorBody);
    } catch {
      errorMsg = await response.text();
    }
    throw new ApiRequestError(
      response.status,
      `API 请求失败 (${response.status}): ${errorMsg || "未知错误"}`
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("API 返回数据格式异常，未找到有效内容");
  }

  return parseResponse(content);
}

// ============ Tab 3: 蹭热点 ============

function buildHotTopicPrompt(
  productName: string,
  sellingPoints: string,
  hotTopics: string[],
  customTopic: string
): string {
  const topicsText = hotTopics.length > 0 ? hotTopics.join("、") : "";
  const customLine = customTopic.trim() ? `\n自定义热点：${customTopic.trim()}` : "";

  return `请将以下产品与当前热点话题结合，生成 3 条小红书蹭热点文案。

产品名称：${productName}
产品卖点：${sellingPoints}
热门话题：${topicsText}${customLine}

要求：
1. 自然地将产品融入热点话题，不要生硬植入，要让读者觉得"这个推荐来得正好"
2. 每条文案需要有吸引眼球的标题和种草内容
3. 使用小红书常见的表达方式，包含适当的 emoji
4. 热点切入要巧妙，避免"蹭热度"的尴尬感
5. 文案要有感染力和真实感
6. 每条文案末尾附带 3-5 个相关的话题标签（包含热点标签）

请严格按照以下 JSON 格式返回（不要包含任何其他内容）：
[
  {
    "content": "文案完整内容（包含标题和正文，使用 \\n 换行）",
    "hashtags": ["#标签1", "#标签2", "#标签3"]
  }
]`;
}

export async function generateHotTopicCopywriting(
  productName: string,
  sellingPoints: string,
  hotTopics: string[],
  customTopic: string
): Promise<GenerateResult[]> {
  const { apiEndpoint, apiKey, modelName } = getConfig();

  if (!apiKey) {
    throw new MissingApiKeyError();
  }

  const prompt = buildHotTopicPrompt(
    productName,
    sellingPoints,
    hotTopics,
    customTopic
  );

  const url = apiEndpoint.endsWith("/chat/completions")
    ? apiEndpoint
    : `${apiEndpoint.replace(/\/$/, "")}/chat/completions`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        {
          role: "system",
          content:
            "你是一个专业的小红书文案专家。你擅长将产品自然地融入热点话题，创作有趣、不尴尬的蹭热点文案。你的回复只包含 JSON 数据，不包含任何其他内容。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.85,
      max_tokens: 4096,
    }),
  });

  if (!response.ok) {
    let errorMsg = "";
    try {
      const errorBody = await response.json();
      errorMsg =
        errorBody.error?.message || errorBody.message || JSON.stringify(errorBody);
    } catch {
      errorMsg = await response.text();
    }
    throw new ApiRequestError(
      response.status,
      `API 请求失败 (${response.status}): ${errorMsg || "未知错误"}`
    );
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("API 返回数据格式异常，未找到有效内容");
  }

  return parseResponse(content);
}
