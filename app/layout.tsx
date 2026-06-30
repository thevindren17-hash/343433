import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mister Mobile AI-Quoter | Instant Trade-In Valuations",
  description:
    "Get an instant trade-in quote for your device. Singapore's highest trade-in rates, backed by the Mister Mobile 100-Step Inspection.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50" suppressHydrationWarning>
        <header className="bg-blue-900 text-white shadow-md">
          <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center">
                <span className="text-blue-900 font-black text-sm">MM</span>
              </div>
              <div>
                <p className="font-bold text-base leading-tight">Mister Mobile</p>
                <p className="text-blue-200 text-xs leading-tight">AI Trade-In Quoter</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-4 text-xs text-blue-200">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block"></span>
                17 Branches Island-wide
              </span>
              <span>CaseTrust Accredited</span>
              <span>ISO 9001 Certified</span>
            </div>
            <a
              href="/chat.html"
              className="flex items-center text-xs bg-blue-800 hover:bg-blue-700 text-blue-100 px-3 py-1.5 rounded-lg border border-blue-700 transition-colors"
            >
              Repair Assistant
            </a>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">{children}</main>
        <footer className="mt-16 border-t border-slate-200 bg-white">
          <div className="max-w-5xl mx-auto px-4 py-6 text-center text-xs text-slate-400">
            <p>
              Mister Mobile Pte. Ltd. · UEN 200814549W · CaseTrust Accredited · ISO 9001/14001
              Certified
            </p>
            <p className="mt-1">
              All quotes are valid for 48 hours and include a 30-day warranty and 7-day no-questions
              return policy.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
