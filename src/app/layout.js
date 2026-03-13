import localFont from "next/font/local";
import "./globals.css";

const literata = localFont({
  src: "../../public/Literata-Variable.ttf",
  variable: "--font-literata",
});

export const metadata = {
  title: "AI Humanizer",
  description: "AI Humanizer is a tool that helps you humanize your AI-generated text.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${literata.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
