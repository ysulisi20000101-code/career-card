import Link from "next/link";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-muted">404</h1>
        <p className="mt-4 text-lg font-semibold text-foreground">页面未找到</p>
        <p className="mt-2 text-sm text-muted-foreground">你访问的页面不存在或已被移除。</p>
        <Link href="/" className="mt-6 inline-block rounded-full bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80">
          返回首页
        </Link>
      </div>
    </div>
  );
}
