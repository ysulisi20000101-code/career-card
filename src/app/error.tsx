"use client";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">出了点问题</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message || "页面加载时发生错误。"}</p>
        <button
          onClick={reset}
          className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
        >
          重试
        </button>
      </div>
    </div>
  );
}
