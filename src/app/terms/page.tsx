import Link from "next/link";
import { BrandLogo } from "@/components/shell/brand-logo";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 flex items-center justify-between">
          <BrandLogo />
          <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">
            返回首页
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-zinc-950">服务条款</h1>
        <div className="mt-6 space-y-5 text-sm leading-7 text-zinc-600">
          <p>
            Career Card 是候选人侧职业表达工具，帮助用户整理简历、生成职业名片和发布公开展示链接。用户应确保上传和发布内容真实、合法，并拥有相应使用权。
          </p>
          <p>
            AI 生成内容仅作为表达建议，不构成求职结果承诺。用户在正式投递或面试前应自行校对所有经历、时间、产出和联系方式。
          </p>
          <p>
            付费版本用于解锁稳定发布、多版本、AI 深度优化和访问统计等权益。当前开发版本中的支付为模拟能力，生产环境需接入真实支付与回调校验。
          </p>
          <p>
            平台可以为安全、合规和服务稳定性记录必要事件，但不应出售用户简历数据或未经授权披露用户个人信息。
          </p>
        </div>
      </div>
    </main>
  );
}
