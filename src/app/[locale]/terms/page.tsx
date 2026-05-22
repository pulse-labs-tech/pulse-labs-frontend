import type { Metadata } from "next";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ScrollReveal } from "@/components/ui/scroll-reveal";
import { generatePageMetadata } from "@/lib/seo";

export const metadata: Metadata = generatePageMetadata({
  title: "Điều khoản Sử dụng — Pulse Knowledge",
  description: "Điều khoản sử dụng dịch vụ Pulse Knowledge. Vui lòng đọc kỹ trước khi sử dụng hệ thống của chúng tôi.",
  path: "/terms",
});

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-auth-bg text-auth-text flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 px-5 py-24 lg:px-8 lg:py-32 max-w-4xl mx-auto w-full">
        <ScrollReveal direction="up" delay={0.1}>
          <h1 className="text-[32px] md:text-[40px] font-extrabold tracking-tight bg-gradient-to-r from-brand-400 to-accent-300 bg-clip-text text-transparent mb-8">
            Điều khoản Sử dụng
          </h1>
        </ScrollReveal>
        
        <ScrollReveal direction="up" delay={0.2} className="prose prose-invert max-w-none text-auth-text-2 space-y-6 text-sm md:text-base leading-relaxed">
          <p>
            Chào mừng bạn đến với <strong>Pulse Knowledge</strong>. Bằng việc truy cập hoặc sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ và bị ràng buộc bởi các điều khoản dưới đây.
          </p>

          <h2 className="text-xl font-bold text-auth-text mt-8 mb-4">1. Chấp nhận Điều khoản</h2>
          <p>
            Khi tạo tài khoản hoặc sử dụng dịch vụ tại Pulse Knowledge, bạn xác nhận rằng bạn đã đọc, hiểu và đồng ý với tất cả điều khoản sử dụng này. Nếu không đồng ý, vui lòng ngưng sử dụng dịch vụ ngay lập tức.
          </p>

          <h2 className="text-xl font-bold text-auth-text mt-8 mb-4">2. Đăng ký tài khoản</h2>
          <p>
            Để sử dụng các tính năng của chúng tôi, bạn có thể được yêu cầu đăng ký tài khoản. Bạn đồng ý cung cấp thông tin chính xác, đầy đủ và chịu trách nhiệm bảo mật thông tin đăng nhập của mình.
          </p>

          <h2 className="text-xl font-bold text-auth-text mt-8 mb-4">3. Quyền sở hữu trí tuệ</h2>
          <p>
            Tất cả tài nguyên, giao diện, logo, mã nguồn của Pulse Knowledge đều thuộc quyền sở hữu trí tuệ của chúng tôi. Bạn không được phép sao chép, phân phối hoặc sửa đổi bất kỳ phần nào của hệ thống mà không có sự đồng ý bằng văn bản từ chúng tôi.
          </p>

          <h2 className="text-xl font-bold text-auth-text mt-8 mb-4">4. Trách nhiệm sử dụng</h2>
          <p>
            Bạn cam kết không sử dụng hệ thống của chúng tôi vào các mục đích vi phạm pháp luật, quấy rối người khác, phát tán thông tin sai lệch hoặc gây tổn hại đến hoạt động bình thường của hệ thống.
          </p>

          <h2 className="text-xl font-bold text-auth-text mt-8 mb-4">5. Thay đổi điều khoản</h2>
          <p>
            Chúng tôi có quyền cập nhật hoặc thay đổi điều khoản này bất kỳ lúc nào để phù hợp với quy định của pháp luật và nâng cấp hệ thống. Các thay đổi sẽ có hiệu lực ngay khi được đăng tải trên trang web này.
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
