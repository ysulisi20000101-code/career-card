import { runCareerCardAgent } from "./career-card-agent";
import type { AgentInput, AgentProviderId, AgentResponse } from "./types";

export interface CareerAgentProvider {
  id: AgentProviderId;
  label: string;
  run(input: AgentInput): Promise<AgentResponse>;
}

const MODEL_PROVIDER_LABELS: Record<Exclude<AgentProviderId, "rules">, string> = {
  mimo: "Mimo",
  deepseek: "DeepSeek",
};

function withProviderTrace(response: AgentResponse, provider: AgentProviderId): AgentResponse {
  if (provider === "rules") {
    return {
      ...response,
      toolTrace: [
        { tool: "derive_intent", status: "used", note: "使用规则 provider 生成结构化建议。" },
        ...response.toolTrace,
      ],
    };
  }

  return {
    ...response,
    safety: [
      ...response.safety,
      {
        id: `${provider}-fallback`,
        message: `${MODEL_PROVIDER_LABELS[provider]} provider 尚未配置，当前使用规则兜底结果。`,
      },
    ],
    toolTrace: [
      {
        tool: "derive_intent",
        status: "fallback",
        note: `${MODEL_PROVIDER_LABELS[provider]} provider 尚未接入，已回退到规则 provider。`,
      },
      ...response.toolTrace,
    ],
  };
}

export function createCareerAgentProvider(provider: AgentProviderId = "rules"): CareerAgentProvider {
  return {
    id: provider,
    label: provider === "rules" ? "Rules" : MODEL_PROVIDER_LABELS[provider],
    async run(input) {
      return withProviderTrace(runCareerCardAgent(input), provider);
    },
  };
}

export async function runCareerCardAgentWithProvider(input: AgentInput): Promise<AgentResponse> {
  const provider = createCareerAgentProvider(input.provider ?? "rules");
  return provider.run(input);
}
