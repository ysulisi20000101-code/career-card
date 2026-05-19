"use client";

interface ExactHtmlInterviewSpaceProps {
  embedded?: boolean;
}

export function ExactHtmlInterviewSpace({ embedded = false }: ExactHtmlInterviewSpaceProps) {
  return (
    <main
      className={`${embedded ? "absolute" : "fixed z-[200]"} inset-0 bg-white`}
      data-testid="exact-html-interview-space"
    >
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
