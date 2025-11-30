import Script from 'next/script';
import { ClientProviders } from '../components/ClientProviders';
import './globals.css';

export const metadata = {
  title: 'Secret Crowdfunding | Privacy-Preserving Fundraising',
  description: 'Built with FHEVM v0.9 - Your commitment amount stays completely private',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* 加载 FHEVM Relayer SDK 0.3.0-5 */}
        <Script
          src="https://cdn.zama.org/relayer-sdk-js/0.3.0-5/relayer-sdk-js.umd.cjs"
          strategy="beforeInteractive"
        />
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}

