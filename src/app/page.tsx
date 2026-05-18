import Link from "next/link";
import { ArrowRight, FileText, MonitorSmartphone, Share2, Sparkles, Upload, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/shell/brand-logo";

const howItWorks = [
  { icon: Upload, title: "上传简历", description: "上传 PDF 简历，系统解析经历、项目、技能和岗位线索。" },
  { icon: Wand2, title: "生成作品", description: "自动生成职业网站和面试空间，不让用户从空白页开始。" },
  { icon: Share2, title: "微调发布", description: "用 Agent 对话修改重点，再发布或进入面试演示。" },
];

const outputs = [
  { title: "职业主页", body: "把简历变成可分享、可追踪、可持续微调的个人网站。" },
  { title: "面试 PPT", body: "上传简历后立刻生成第一版演示，先给用户强反馈。" },
  { title: "对话微调", body: "围绕开场、页数、表达风格和重点顺序继续优化。" },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f7f8fb] text-zinc-950">
      <header className="border-b border-zinc-200/70 bg-white/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 lg:px-6">
          <BrandLogo />
          <div className="flex items-center gap-3">
            <Link href="/profile" className="text-sm font-medium text-zinc-500 hover:text-zinc-900">
              查看样例
            </Link>
            <Link href="/workspace">
              <Button variant="brand" size="sm" className="gap-1.5 rounded-full">
                进入工作台
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-14 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-center lg:px-6 lg:py-20">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-semibold text-indigo-700 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" />
            简历上传后，先生成可看的第一版
          </div>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-tight tracking-normal text-zinc-950 sm:text-5xl lg:text-6xl">
            简历变成面试官想看的职业网站和演示 PPT
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-600 sm:text-lg">
            Career Card 把简历解析成结构化素材，再生成可发布的个人网站和可投屏的面试空间。用户先拿到完整初稿，再用 Agent 微调重点、节奏和表达方式。
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/workspace/personal/new">
              <Button size="lg" variant="brand" className="gap-2 rounded-full px-7 shadow-md shadow-indigo-500/20">
                <FileText className="h-5 w-5" />
                创建职业档案
              </Button>
            </Link>
            <Link href="/workspace/interview/new">
              <Button variant="outline" size="lg" className="gap-2 rounded-full border-zinc-300 bg-white px-7">
                <MonitorSmartphone className="h-5 w-5" />
                创建面试演示
              </Button>
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl shadow-zinc-200/70">
          <div className="rounded-xl bg-zinc-950 p-4 text-white">
            <div className="flex items-center justify-between text-xs text-white/55">
              <span>Interview Space</span>
              <span>Auto draft</span>
            </div>
            <div className="mt-8 h-2 w-28 rounded-full bg-indigo-400" />
            <div className="mt-4 h-4 w-4/5 rounded-full bg-white/90" />
            <div className="mt-3 h-4 w-2/3 rounded-full bg-white/55" />
            <div className="mt-8 grid grid-cols-3 gap-3">
              {["故事主线", "项目证据", "表达节奏"].map((item) => (
                <div key={item} className="rounded-lg border border-white/10 bg-white/10 p-3">
                  <div className="h-8 rounded-md bg-white/15" />
                  <p className="mt-3 text-xs font-medium text-white/80">{item}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-3">
            {outputs.map((item) => (
              <div key={item.title} className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                <p className="text-sm font-semibold text-zinc-900">{item.title}</p>
                <p className="mt-1 text-xs leading-5 text-zinc-500">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-5 pb-16 lg:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {howItWorks.map((step, index) => (
            <div key={step.title} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-950 text-white">
                  <step.icon className="h-5 w-5" />
                </span>
                <span className="text-xs font-semibold text-zinc-300">0{index + 1}</span>
              </div>
              <p className="mt-5 text-base font-semibold text-zinc-950">{step.title}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-zinc-200 bg-white px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs text-zinc-400 sm:flex-row">
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:text-zinc-700">
              隐私政策
            </Link>
            <Link href="/terms" className="hover:text-zinc-700">
              服务条款
            </Link>
          </div>
          <p>&copy; {new Date().getFullYear()} Career Card. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
