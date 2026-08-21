import type { Metadata, Viewport } from "next";
import { Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const sans = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Texter", template: "%s · Texter" },
  description:
    "The copy desk for teams writing US marketing in a second language. Upload the artwork, answer a few questions, ship copy that sounds native.",
  applicationName: "Texter",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Texter", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Lets the app paint under the notch and the home indicator.
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f7f9" },
    { media: "(prefers-color-scheme: dark)", color: "#0b1119" },
  ],
};

// Applies the saved theme before first paint, so a dark-mode user never gets a
// white flash. Kept inline and tiny on purpose.
const THEME_BOOT = `(function(){try{var t=localStorage.getItem("texter-theme");if(t==="dark"||t==="light"){document.documentElement.classList.add(t)}}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
