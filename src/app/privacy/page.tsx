import Link from "next/link";
import { BrandLogo } from "@/components/shell/brand-logo";

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 flex items-center justify-between">
          <BrandLogo />
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">
            返回首页
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-zinc-950">隐私政策</h1>
        <div className="mt-6 space-y-5 text-sm leading-7 text-zinc-600">
          <p>
            Career Card 处理的数据包括你上传的简历文本、编辑后的职业内容、发布快照和访问统计。我们仅在完成简历解析、内容生成、发布管理所必需的范围内处理你的数据。
          </p>
          <p>
            简历 PDF 解析完全在浏览器本地完成，简历原文不会上传到服务器。如果你配置了 AI 供应商（如 DeepSeek），AI 生成功能会通过加密连接调用供应商接口，供应商不会将你的数据用于模型训练。
          </p>
          <p>
            你可以随时删除草稿、撤回发布站点。手机号等敏感信息不会默认公开展示，你可自行决定公开展示哪些信息。
          </p>
          <p>
            API Key 仅保存在你的浏览器本地，不会上传到 Career Card 服务器。发布数据存储在服务端数据库中，仅用于生成公开页面和阅读统计。
          </p>
          <p>
            如有疑问或数据删除请求，请通过 GitHub Issues 联系我们。
          </p>
        </div>
      </div>
    </main>
  );
}
