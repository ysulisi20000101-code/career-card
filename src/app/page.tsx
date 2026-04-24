"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles,
  ArrowRight,
  FileText,
  GitBranch,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/shell/brand-logo";

const features = [
  {
    icon: FileText,
    title: "智能解析与确认",
    description: "上传 PDF 后自动提取结构化信息，并在确认页快速校对与补全",
    gradient: "from-blue-500 to-indigo-500",
    bg: "bg-blue-50",
  },
  {
    icon: GitBranch,
    title: "交互式时间线",
    description: "将职业经历转化为可视化时间线、技能图谱和架构图，交互式演示",
    gradient: "from-violet-500 to-purple-500",
    bg: "bg-violet-50",
  },
  {
    icon: Share2,
    title: "一键发布分享",
    description: "生成可投递链接与面试展示内容，让面试官快速看懂你的匹配度",
    gradient: "from-rose-500 to-pink-500",
    bg: "bg-rose-50",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.5, ease: [0.33, 1, 0.68, 1] as const },
  }),
};

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      {/* Background decoration */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[700px] w-[700px] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-100/60 via-violet-100/40 to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[500px] w-[500px] rounded-full bg-gradient-to-tl from-rose-100/40 via-amber-100/20 to-transparent blur-3xl" />
        <div className="absolute left-0 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-gradient-to-r from-emerald-100/30 to-transparent blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-5 lg:px-12">
          <BrandLogo />
          <Link href="/workspace">
            <Button variant="brand" size="sm" className="gap-1 rounded-full">
              进入我的空间
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </header>

        {/* Hero */}
        <section className="mx-auto flex max-w-4xl flex-col items-center px-6 pb-20 pt-24 text-center lg:pt-32">
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200/60 bg-indigo-50/60 px-4 py-1.5 text-xs font-medium text-indigo-600"
          >
            <Sparkles className="h-3.5 w-3.5" />
            候选人职业表达平台
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.6 }}
            className="bg-gradient-to-r from-zinc-900 via-indigo-800 to-violet-700 bg-clip-text text-5xl font-bold leading-tight tracking-tight text-transparent sm:text-6xl lg:text-7xl"
          >
            职场名片
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-500"
          >
            一键生成可投递的个人职业网站，让不会 coding 的求职者也能讲清自己的价值
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="mt-10 flex items-center gap-4"
          >
            <Link href="/workspace/personal/new">
              <Button size="lg" variant="brand" className="gap-2 rounded-full px-8">
                立即开始
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/profile">
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-8"
              >
                查看示例
              </Button>
            </Link>
          </motion.div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-5xl px-6 pb-32">
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                variants={fadeUp}
              >
                <div className="group relative rounded-2xl border border-zinc-100 bg-white/80 p-8 shadow-sm backdrop-blur transition-all hover:border-zinc-200 hover:shadow-md">
                  <div
                    className={`mb-5 inline-flex rounded-xl ${feature.bg} p-3`}
                  >
                    <feature.icon
                      className={`h-6 w-6 bg-gradient-to-br ${feature.gradient} bg-clip-text`}
                      style={{
                        color:
                          feature.gradient === "from-blue-500 to-indigo-500"
                            ? "#4f46e5"
                            : feature.gradient ===
                                "from-violet-500 to-purple-500"
                              ? "#7c3aed"
                              : "#e11d48",
                      }}
                    />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-zinc-900">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-zinc-500">
                    {feature.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-100 py-8 text-center text-xs text-zinc-400">
          © {new Date().getFullYear()} 职场名片 · 让每一份简历都值得被看见
        </footer>
      </div>
    </div>
  );
}
