import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const sans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const display = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: { default: "Texter", template: "%s · Texter" },
  description:
    "The copy desk for teams writing US marketing in a second language. Upload the artwork, answer a few questions, ship copy that sounds native.",
};

// Reads the saved theme before first paint so a dark-mode user never sees a
// white flash. Kept inline and tiny on purpose.
const THEME_BOOT = `(function(){try{var t=localStorage.getItem("texter-theme");if(t==="dark"||t==="light"){document.documentElement.classList.add(t)}}catch(e){}})()`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${mono.variable} ${display.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
