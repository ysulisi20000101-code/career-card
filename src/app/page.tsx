"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Clock3, FileText, ShieldCheck, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/shell/brand-logo";

const valueCards = [
  {
    icon: Clock3,
    title: "5 分钟得到职业档案草稿",
    description: "上传 PDF 后先生成可校准草稿，用户只需要确认关键信息和表达重点。",
  },
  {
    icon: FileText,
    title: "把经历讲成面试官能读懂的结构",
    description: "围绕目标角色、成长线、亮点支撑和能力地图组织内容，而不是堆简历条目。",
  },
  {
    icon: TrendingUp,
    title: "发布后看到真实阅读反馈",
    description: "记录打开、有效浏览和最近访问时间，帮助判断分享链接是否真的被阅读。",
  },
  {
    icon: ShieldCheck,
    title: "隐私和公开范围可控",
    description: "联系方式、草稿、发布链接和原始文件都应能被用户确认、隐藏或撤回。",
  },
];

const audiences = ["1-3 年社招候选人", "3-8 年骨干/负责人", "转岗或换赛道求职者"];

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[620px] w-[620px] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-100/70 via-sky-100/40 to-transparent blur-3xl" />
        <div className="absolute bottom-0 right-0 h-[460px] w-[460px] rounded-full bg-gradient-to-tl from-emerald-100/35 via-amber-100/25 to-transparent blur-3xl" />
      </div>

      <div className="relative z-10">
        <header className="flex items-center justify-between px-6 py-5 lg:px-12">
          <BrandLogo />
          <div className="flex items-center gap-2">
            <Link href="/profile" className="hidden text-sm text-zinc-500 hover:text-zinc-900 sm:inline">
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

        <section className="mx-auto grid max-w-6xl gap-10 px-6 pb-20 pt-16 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-24">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-indigo-200/70 bg-indigo-50/70 px-4 py-1.5 text-xs font-medium text-indigo-700"
            >
              面向社招候选人的职业表达工具
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.55 }}
              className="max-w-4xl text-5xl font-semibold leading-tight tracking-normal text-zinc-950 sm:text-6xl lg:text-7xl"
            >
              5 分钟生成可分享的职业档案草稿
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.5 }}
              className="mt-6 max-w-2xl text-lg leading-8 text-zinc-600"
            >
              Career Card 帮求职者把项目经历、成长路径和亮点支撑整理成一份稳定链接，让面试官更快判断候选人的角色匹配和核心能力。
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.34, duration: 0.5 }}
              className="mt-9 flex flex-wrap gap-3"
            >
              <Link href="/workspace/personal/new">
                <Button size="lg" variant="brand" className="gap-2 rounded-full px-8">
                  开始生成草稿
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/profile">
                <Button variant="outline" size="lg" className="rounded-full px-8">
                  查看样例职业档案
                </Button>
              </Link>
            </motion.div>

            <div className="mt-7 flex flex-wrap gap-2">
              {audiences.map((audience) => (
                <span key={audience} className="rounded-full border border-zinc-200 bg-white/80 px-3 py-1 text-xs text-zinc-600 shadow-sm">
                  {audience}
                </span>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.55 }}
            className="rounded-lg border border-zinc-100 bg-white/85 p-5 shadow-xl shadow-zinc-200/60 backdrop-blur"
          >
            <div className="rounded-md bg-zinc-950 p-5 text-white">
              <p className="text-xs uppercase tracking-[0.18em] text-white/42">面试官 30 秒看到</p>
              <div className="mt-5 space-y-4">
                {["目标角色与候选人定位", "最有说服力的职业亮点", "能力成长路径与关键产出", "联系方式与公开资料"].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.06] p-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-xs font-semibold text-zinc-950">
                      {index + 1}
                    </span>
                    <span className="text-sm text-white/82">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {valueCards.map((card, index) => (
              <motion.div
                key={card.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06, duration: 0.4 }}
                className="rounded-lg border border-zinc-100 bg-white/85 p-5 shadow-sm backdrop-blur transition-all hover:-translate-y-1 hover:shadow-md"
              >
                <div className="mb-4 inline-flex rounded-lg bg-indigo-50 p-3 text-indigo-600">
                  <card.icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-semibold text-zinc-950">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-500">{card.description}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
