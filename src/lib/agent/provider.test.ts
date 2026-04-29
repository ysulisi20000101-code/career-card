import { afterEach, describe, expect, it, vi } from "vitest";
import { mockResumeData } from "@/lib/mock-data";
import { runCareerCardAgentWithProvider } from "./provider";

describe("runCareerCardAgentWithProvider", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("uses rules fallback without calling the network when model config is missing", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const response = await runCareerCardAgentWithProvider({
      resumeData: mockResumeData,
      provider: "deepseek",
      intent: "ask_clarifying_questions",
    });

    expect(fetchMock).not.toHaveBeenCalled();
    expect(response.safety.some((item) => item.id === "deepseek-fallback")).toBe(true);
    expect(response.toolTrace[0]).toMatchObject({ status: "fallback" });
  });

  it("calls configured DeepSeek-compatible chat completions and normalizes unsafe patches", async () => {
    vi.stubEnv("DEEPSEEK_API_KEY", "test-key");
    const fetchMock = vi.fn(async () => {
      return new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  type: "suggestion",
                  summary: "Model-generated career suggestion.",
                  questions: [],
                  suggestions: [
                    {
                      id: "model-suggestion",
                      title: "Sharpen the opening summary",
                      body: "Use the existing profile and timeline evidence.",
                      priority: "high",
                      evidence: ["existing profile"],
                      patches: [
                        {
                          id: "profile-summary",
                          label: "Profile summary",
                          path: "profile.summary",
                          value: "Sharper summary from existing facts.",
                          requiresConfirmation: false,
                        },
                      ],
                    },
                  ],
                  findings: [],
                  patches: [],
                  safety: [],
                }),
              },
            },
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const response = await runCareerCardAgentWithProvider({
      resumeData: mockResumeData,
      provider: "deepseek",
      intent: "analyze_resume",
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.deepseek.com/chat/completions");
    expect(JSON.parse(String(init?.body)).model).toBe("deepseek-v4-flash");
    expect(response.summary).toBe("Model-generated career suggestion.");
    expect(response.patches.every((patch) => patch.requiresConfirmation)).toBe(true);
    expect(response.safety.some((item) => item.id === "deepseek-schema-checked")).toBe(true);
    expect(response.toolTrace[0]).toMatchObject({ status: "used" });
  });

  it("falls back to rules when configured provider returns invalid JSON", async () => {
    vi.stubEnv("MIMO_API_KEY", "test-key");
    vi.stubEnv("MIMO_BASE_URL", "https://mimo.example/v1");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        return new Response(
          JSON.stringify({
            choices: [{ message: { content: "not json" } }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }),
    );

    const response = await runCareerCardAgentWithProvider({
      resumeData: mockResumeData,
      provider: "mimo",
      intent: "review_before_publish",
    });

    expect(response.safety.some((item) => item.id === "mimo-runtime-fallback")).toBe(true);
    expect(response.toolTrace[0]).toMatchObject({ status: "fallback" });
    expect(response.intent).toBe("review_before_publish");
  });
});
