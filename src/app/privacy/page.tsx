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
            Career Card 处理的数据包括你上传的简历文本、编辑后的职业名片内容、发布快照和访问统计。我们只将这些数据用于生成、保存、发布和优化你的职业表达。
          </p>
          <p>
            公开职业站默认使用发布快照，不直接暴露编辑态草稿。手机号等敏感联系方式不应默认公开展示；后续正式版本会提供字段级隐藏开关。
          </p>
          <p>
            你可以删除草稿、撤回发布站点和清理上传记录。当前本地开发版本使用本机 JSON 文件模拟数据库，生产环境应替换为受控数据库和对象存储。
          </p>
          <p>
            AI 处理只在服务端调用供应商接口，API Key 不会进入前端。日志和事件中应避免记录完整手机号、邮箱、API Key 和完整简历原文。
          </p>
        </div>
      </div>
    </main>
  );
}
