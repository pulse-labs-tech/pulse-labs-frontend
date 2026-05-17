import Link from "next/link";
import Image from "next/image";

const footerLinks = {
  product: [
    { href: "#features", label: "Tính năng" },
    { href: "#how-it-works", label: "Cách hoạt động" },
    { href: "#cta", label: "Bảng giá" },
  ],
  support: [
    { href: "/terms", label: "Điều khoản" },
    { href: "/privacy", label: "Bảo mật" },
    { href: "mailto:support@pulseknowledge.com", label: "Liên hệ" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-white/[0.06] bg-auth-bg">
      <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 3xl:max-w-[1680px] 4xl:max-w-[2200px]">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-md shadow-[0_0_10px_rgba(52,211,153,0.2)]">
                <Image src="/images/logo-512.png" alt="Pulse Knowledge" width={28} height={28} className="h-full w-full object-cover" />
              </div>
              <span className="text-sm font-bold tracking-tight text-auth-text">
                Pulse<span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">Knowledge</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-xs leading-relaxed text-auth-text-3">AI Researcher cá nhân hoá — tích lũy knowledge theo domain. Hỏi gì cũng có câu trả lời có nguồn.</p>
          </div>
          <div>
            <h4 className="mb-3.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-auth-text-2">Sản phẩm</h4>
            <ul className="flex flex-col gap-2.5">
              {footerLinks.product.map((l) => (<li key={l.href}><a href={l.href} className="text-xs text-auth-text-3 transition-colors duration-200 hover:text-auth-text-2">{l.label}</a></li>))}
            </ul>
          </div>
          <div>
            <h4 className="mb-3.5 text-[11px] font-semibold uppercase tracking-[0.15em] text-auth-text-2">Hỗ trợ</h4>
            <ul className="flex flex-col gap-2.5">
              {footerLinks.support.map((l) => (<li key={l.href}><Link href={l.href} className="text-xs text-auth-text-3 transition-colors duration-200 hover:text-auth-text-2">{l.label}</Link></li>))}
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-white/[0.04] pt-6">
          <p className="text-center text-[11px] text-auth-text-3/60">© {new Date().getFullYear()} Pulse Knowledge. Bảo lưu mọi quyền.</p>
        </div>
      </div>
    </footer>
  );
}
