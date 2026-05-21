import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { generatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = generatePageMetadata({
  title: "Chính sách Bảo mật — Pulse Knowledge",
  description: "Chính sách bảo mật thông tin người dùng của Pulse Knowledge. Tìm hiểu cách chúng tôi thu thập, sử dụng và bảo vệ dữ liệu của bạn.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-auth-bg text-auth-text flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 px-5 py-24 lg:px-8 lg:py-32 max-w-4xl mx-auto w-full">
        <ScrollReveal direction="up" delay={0.1}>
          <h1 className="text-[32px] md:text-[40px] font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent mb-8">
            Chính sách Bảo mật
          </h1>
        </ScrollReveal>
        
        <ScrollReveal direction="up" delay={0.2} className="prose prose-invert max-w-none text-auth-text-2 space-y-6 text-sm md:text-base leading-relaxed">
          <p>
            Tại <strong>Pulse Knowledge</strong>, bảo vệ thông tin cá nhân và quyền riêng tư của bạn là ưu tiên hàng đầu của chúng tôi. Chính sách này giải thích cách chúng tôi xử lý dữ liệu của bạn.
          </p>

          <h2 className="text-xl font-bold text-auth-text mt-8 mb-4">1. Thông tin Chúng tôi Thu thập</h2>
          <p>
            Khi đăng ký và sử dụng dịch vụ, chúng tôi có thể thu thập thông tin cá nhân như tên, địa chỉ email và bất kỳ thông tin nào bạn nhập vào các bộ nhớ kiến thức (Knowledge Base) của bạn.
          </p>

          <h2 className="text-xl font-bold text-auth-text mt-8 mb-4">2. Cách Chúng tôi Sử dụng Thông tin</h2>
          <p>
            Chúng tôi sử dụng thông tin thu thập được nhằm:
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Cung cấp, duy trì và cải thiện các tính năng của dịch vụ Pulse Knowledge.</li>
            <li>Tối ưu hóa các công cụ tìm kiếm và nghiên cứu cá nhân của riêng bạn.</li>
            <li>Gửi các thông báo quan trọng liên quan đến tài khoản và hoạt động bảo mật.</li>
          </ul>

          <h2 className="text-xl font-bold text-auth-text mt-8 mb-4">3. Bảo vệ và Lưu trữ Dữ liệu</h2>
          <p>
            Dữ liệu của bạn được mã hóa an toàn trong quá trình truyền tải và lưu trữ. Chúng tôi áp dụng các biện pháp kỹ thuật và tổ chức tối ưu để ngăn chặn việc truy cập trái phép, tiết lộ hoặc thay đổi dữ liệu của bạn.
          </p>

          <h2 className="text-xl font-bold text-auth-text mt-8 mb-4">4. Quyền của Bạn đối với Dữ liệu</h2>
          <p>
            Bạn có toàn quyền truy cập, chỉnh sửa hoặc yêu cầu xóa thông tin cá nhân và toàn bộ Knowledge Base của mình bất kỳ lúc nào thông qua trang cài đặt tài khoản.
          </p>

          <h2 className="text-xl font-bold text-auth-text mt-8 mb-4">5. Thay đổi Chính sách Bảo mật</h2>
          <p>
            Chúng tôi có thể cập nhật chính sách bảo mật này theo thời gian. Mọi thay đổi sẽ được công bố trên trang web này cùng với ngày cập nhật mới nhất.
          </p>

          <p className="pt-6 border-t border-white/10 text-xs text-auth-text-3">
            Cập nhật lần cuối: ngày 21 tháng 05 năm 2026.
          </p>
        </ScrollReveal>
      </main>
      <Footer />
    </div>
  );
}
