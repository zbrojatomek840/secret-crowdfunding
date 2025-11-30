'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              🔒 Secret Crowdfunding
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 mt-4">
              Privacy-Preserving Fundraising with FHEVM
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid md:grid-cols-3 gap-6 my-12">
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="text-4xl mb-4">🔐</div>
              <h3 className="text-lg font-semibold mb-2">Fully Encrypted</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your commitment amount is encrypted on-chain
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-lg font-semibold mb-2">Simple Flow</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Submit, wait, and decrypt - that's it
              </p>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-lg font-semibold mb-2">FHEVM v0.9</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Powered by Zama's latest FHE technology
              </p>
            </div>
          </div>

          {/* CTA Button */}
          <Link
            href="/dapp"
            className="inline-block bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold text-lg px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          >
            Launch DApp →
          </Link>

          {/* Tech Stack */}
          <div className="mt-16 text-sm text-gray-500 dark:text-gray-400">
            <p>Built with Next.js 15 • RainbowKit • Wagmi • FHEVM v0.9</p>
          </div>
        </div>
      </div>
    </div>
  );
}

