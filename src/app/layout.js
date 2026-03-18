import localFont from "next/font/local";
import { Geist } from "next/font/google";
import "./globals.css";

const literata = localFont({
  src: "../../public/Literata-Variable.ttf",
  variable: "--font-literata",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  weight: ["300", "400", "500", "600"],
  display: "swap",
});

export const metadata = {
  title: "Rewrite",
  description: "A premium text rewriting tool.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${literata.variable} ${geist.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
