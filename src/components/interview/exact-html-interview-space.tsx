"use client";

export function ExactHtmlInterviewSpace() {
  return (
    <main className="fixed inset-0 z-[200] bg-white" data-testid="exact-html-interview-space">
      <iframe
        src="/reference-html/lijintao-interview-main.html"
        title="李锦涛面试空间"
        className="h-full w-full border-0"
        sandbox="allow-scripts allow-same-origin"
        allowFullScreen
      />
    </main>
  );
}
