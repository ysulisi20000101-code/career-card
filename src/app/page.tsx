"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, FileText, MonitorSmartphone, Upload, Wand2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/shell/brand-logo";

const howItWorks = [
  { icon: Upload, title: "上传简历", description: "上传 PDF 简历，AI 自动解析经历与技能" },
  { icon: Wand2, title: "Agent 生成网站", description: "AI 自动生成个人职业网站，可对话精修" },
  { icon: Share2, title: "发布分享", description: "一键发布，生成可分享的链接发送给面试官" },
];

const trustPoints = [
  {
    icon: "🏠",
    title: "数据不上传服务器",
    description: "简历解析和 AI 生成在浏览器完成，数据始终在你手里。",
  },
  {
    icon: "⚡",
    title: "3 分钟生成网站",
    description: "AI 自动提取经历、匹配能力、生成叙事，比手动排版快 100 倍。",
  },
  {
    icon: "🔗",
    title: "随时发布，随时撤回",
    description: "公开链接可一键撤回，控制谁能看到你的职业信息。",
  },
];

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      {/* 背景光晕 */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-100/70 via-sky-100/40 to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[460px] w-[460px] rounded-full bg-gradient-to-tl from-emerald-100/35 via-indigo-100/25 to-transparent blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-5 lg:px-12">
          <BrandLogo />
          <div className="flex items-center gap-3">
            <Link href="/profile" className="text-sm text-muted-foreground hover:text-zinc-900">
              查看样例
            </Link>
            <Link href="/workspace">
              <Button variant="brand" size="sm" className="gap-1 rounded-full">
                进入工作台
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </header>

        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 pb-10 pt-16 text-center">
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mx-auto max-w-3xl text-5xl font-semibold leading-tight tracking-normal text-zinc-950 sm:text-6xl lg:text-7xl"
          >
            简历变成<span className="bg-gradient-to-r from-indigo-500 to-violet-600 bg-clip-text text-transparent">面试官想看的</span>
            <br />
            职业网站
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.5 }}
            className="mt-5 text-xl font-medium text-zinc-700"
          >
            简历变职业网站，面试变故事演示
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22, duration: 0.5 }}
            className="mx-auto mt-3 max-w-xl text-base leading-7 text-muted-foreground"
          >
            上传一份简历，AI 自动生成可公开分享的职业网站。同一份简历，不同岗位方向各自优化。发布后还能看到面试官的阅读反馈。
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.34, duration: 0.5 }}
            className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
          >
            <Link href="/workspace/personal/new">
              <Button size="lg" variant="brand" className="gap-2 rounded-full px-7 shadow-md shadow-indigo-500/25">
                <FileText className="h-5 w-5" />
                创建职业档案
              </Button>
            </Link>
            <Link href="/workspace/interview/new">
              <Button variant="outline" size="lg" className="gap-2 rounded-full px-7">
                <MonitorSmartphone className="h-5 w-5" />
                创建面试演示
              </Button>
            </Link>
          </motion.div>
        </section>

        {/* 场景对比区 */}
        <section className="mx-auto max-w-5xl px-6 pb-20">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* 场景一：职业网站 */}
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18, duration: 0.5 }}
              className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-lg"
            >
              <div className="bg-gradient-to-r from-indigo-500 to-violet-600 px-5 py-3.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/70">场景一</p>
                <p className="mt-0.5 text-base font-semibold text-white">一份简历 · 多个目标站点</p>
              </div>
              <div className="space-y-3 p-5">
                <div className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-100 text-sm font-bold text-indigo-600">
                    📋
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-800">基础简历数据</p>
                    <p className="mt-0.5 text-xs text-zinc-500">一次上传，所有站点共用同一份事实数据</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <ArrowRight className="h-5 w-5 text-indigo-300" />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2.5">
                    <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-400" />
                    <span className="text-sm text-emerald-800">AI Agent 产品经理 → 强调 AI 产品经验、数据思维</span>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-lg border border-violet-200 bg-violet-50/50 px-3 py-2.5">
                    <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-violet-400" />
                    <span className="text-sm text-violet-800">技术产品负责人 → 突出架构理解力、技术视野</span>
                  </div>
                  <div className="flex items-center gap-2.5 rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2.5">
                    <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-blue-400" />
                    <span className="text-sm text-blue-800">增长产品经理 → 侧重增长实验、指标体系</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* 场景二：面试演示 */}
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.26, duration: 0.5 }}
              className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-lg"
            >
              <div className="bg-gradient-to-r from-violet-500 to-fuchsia-500 px-5 py-3.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-white/70">场景二</p>
                <p className="mt-0.5 text-base font-semibold text-white">面试时 · 经历变成故事</p>
              </div>
              <div className="space-y-3 p-5">
                <div className="flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-sm font-bold text-violet-500">
                    🎤
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-800">输入目标岗位</p>
                    <p className="mt-0.5 text-xs text-zinc-500">AI 根据 JD 自动编排讲述节奏</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <ArrowRight className="h-5 w-5 text-zinc-300" />
                </div>
                <div className="space-y-2 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 p-4 text-white">
                  <p className="text-xs font-medium uppercase tracking-wider text-white/60">演示稿结构</p>
                  {["开场定位与核心叙事", "关键项目故事线", "能力跃迁与成长弧线", "量化成果与证据链"].map((item, index) => (
                    <div key={item} className="flex items-center gap-3 rounded-lg border border-white/15 bg-white/[0.10] px-3 py-2">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-violet-500">
                        {index + 1}
                      </span>
                      <span className="text-sm text-white/90">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* 三步搞定 */}
        <section className="mx-auto max-w-4xl px-6 pb-16">
          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center text-sm font-semibold uppercase tracking-widest text-zinc-400"
          >
            三步搞定
          </motion.h2>
          <div className="mt-8 grid gap-8 md:grid-cols-3">
            {howItWorks.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="text-center"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-950 text-white">
                  <step.icon className="h-5 w-5" />
                </div>
                <p className="text-sm font-semibold text-zinc-900">{step.title}</p>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* 信任条 */}
        <div className="border-t border-zinc-100 bg-zinc-50/80 py-12">
          <div className="mx-auto max-w-4xl px-6">
            <div className="grid gap-6 md:grid-cols-3">
              {trustPoints.map((point) => (
                <div key={point.title} className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-lg shadow-sm">
                    {point.icon}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-800">{point.title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-500">{point.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="border-t border-zinc-100 bg-white px-6 py-8">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-4 text-xs text-zinc-400">
              <Link href="/privacy" className="transition-colors hover:text-zinc-600">
                隐私政策
              </Link>
              <Link href="/terms" className="transition-colors hover:text-zinc-600">
                服务条款
              </Link>
            </div>
            <p className="text-xs text-zinc-400">
              &copy; {new Date().getFullYear()} Career Card. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
