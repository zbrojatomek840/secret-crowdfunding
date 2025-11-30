# 🔒 Secret Crowdfunding

> Built with FHEVM v0.9 - Privacy-Preserving Fundraising Platform

A fully encrypted crowdfunding platform where users' commitment amounts remain completely private on-chain. Only the user can decrypt and view their own amount.

## 🌟 Features

- **Fully Encrypted**: Commitment amounts are encrypted using Fully Homomorphic Encryption (FHE)
- **Privacy-First**: Only you can decrypt and view your commitment amount
- **Simple Flow**: Submit encrypted amount → Wait 10s → Decrypt and view
- **User-Side Decryption**: All decryption happens client-side using `userDecrypt`
- **No Backend**: Pure smart contract + client-side encryption/decryption

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm
- MetaMask or compatible Web3 wallet
- Sepolia testnet ETH

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd secret-crowdfunding

# Install Hardhat dependencies
cd packages/hardhat
pnpm install

# Install Next.js dependencies
cd ../nextjs
pnpm install
```

### Deploy Smart Contract

```bash
cd packages/hardhat

# Create .env file
echo "PRIVATE_KEY=0x59e3b295cac7e094845767d8f828441ca750d939c63ad05007d0c3e9a860c74d" > .env
echo "RPC_URL=https://eth-sepolia.g.alchemy.com/v2/PdDY0FCflhQnCiLhEwxih" >> .env

# Compile and deploy
pnpm compile
pnpm deploy
```

Copy the deployed contract address from the output.

### Run Frontend

```bash
cd packages/nextjs

# Create .env.local file
echo "NEXT_PUBLIC_CONTRACT_ADDRESS=<YOUR_DEPLOYED_CONTRACT_ADDRESS>" > .env.local

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 User Flow

1. **Connect Wallet**: Click "Connect Wallet" and connect MetaMask
2. **Enter Amount**: Input your crowdfunding commitment amount (e.g., 5000)
3. **Submit**: Click "提交承诺" to encrypt and submit to blockchain
4. **Wait**: Countdown 10 seconds for permission sync
5. **Decrypt**: Click "解密查看金额" to decrypt and view your amount
6. **View Result**: See your private commitment amount

## 🏗️ Architecture

### Smart Contract (FHEVM v0.9)

- **File**: `packages/hardhat/contracts/SecretCrowdfunding.sol`
- **Inherits**: `ZamaEthereumConfig`
- **Core Functions**:
  - `submitCommitment(externalEuint32, bytes)`: Submit encrypted amount
  - `getMyCommitment()`: Get encrypted handle for decryption
  - `hasCommitted(address)`: Check if user has submitted

### Frontend (Next.js 15)

- **Framework**: Next.js 15 + React 19
- **Styling**: Tailwind CSS
- **Web3**: RainbowKit + Wagmi
- **FHEVM SDK**: Relayer SDK 0.3.0-5 (CDN)

### Key Technical Details

1. **Double Authorization Pattern**:
   ```solidity
   FHE.allowThis(amount);         // Contract can return handle
   FHE.allow(amount, msg.sender); // User can decrypt
   ```

2. **Client-Side Decryption**:
   - Uses `userDecrypt` with EIP-712 signature
   - No `FHE.requestDecryption` on contract
   - User maintains full control

3. **10-Second Countdown**:
   - Ensures permission sync before decryption
   - Prevents relayer 500 errors

## 🔒 Privacy & Security

- **On-Chain Privacy**: All amounts are encrypted using FHE (euint32)
- **User Control**: Only the user can decrypt their own data
- **No Plaintext**: Smart contract never sees plaintext amounts
- **Client-Side**: All encryption/decryption happens in browser

## 📊 FHEVM Configuration

### System Contracts (Sepolia)

```typescript
chainId: 11155111
aclContractAddress: 0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D
kmsContractAddress: 0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A
inputVerifierContractAddress: 0xBBC1fFCdc7C316aAAd72E807D9b0272BE8F84DA0
verifyingContractAddressDecryption: 0x5D8BD78e2ea6bbE41f26dFe9fdaEAa349e077478
verifyingContractAddressInputVerification: 0x483b9dE06E4E4C7D35CCf5837A1668487406D955
gatewayChainId: 10901
relayerUrl: https://relayer.testnet.zama.org
```

## 🛠️ Development

### Project Structure

```
secret-crowdfunding/
├── packages/
│   ├── hardhat/
│   │   ├── contracts/
│   │   │   └── SecretCrowdfunding.sol
│   │   ├── scripts/
│   │   │   └── deploy.ts
│   │   └── hardhat.config.ts
│   └── nextjs/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx
│       │   └── dapp/
│       │       └── page.tsx
│       ├── components/
│       │   ├── Providers.tsx
│       │   └── ClientProviders.tsx
│       ├── utils/
│       │   └── wallet.ts
│       ├── next.config.js
│       └── vercel.json
└── README.md
```

### Key Dependencies

**Hardhat**:
- `@fhevm/solidity`: 0.9.1
- `@fhevm/host-contracts`: ^0.9.0
- `encrypted-types`: ^0.0.4

**Next.js**:
- `next`: ^15.0.0
- `@rainbow-me/rainbowkit`: ^2.0.0
- `wagmi`: ^2.0.0
- `ethers`: ^6.9.0

## 🚀 Deployment

### Deploy to Vercel

1. Push to GitHub:
   ```bash
   git add .
   git commit -m "feat: Secret Crowdfunding DApp"
   git push origin main
   ```

2. Import to Vercel:
   - Root Directory: `packages/nextjs`
   - Environment Variables:
     - `NEXT_PUBLIC_CONTRACT_ADDRESS`: Your deployed contract address

3. Deploy and enjoy!

### Important Configuration

- **CORS Headers**: Configured in `vercel.json` and `next.config.js`
- **Webpack Fallbacks**: Required for RainbowKit compatibility
- **SDK Version**: Must use 0.3.0-5 for FHEVM v0.9

## 🎯 Core Principles

Following the WINNING_FORMULA.md guidelines:

1. ✅ **Grand Narrative**: Privacy-preserving crowdfunding
2. ✅ **Exquisite UI**: Modern, clean, responsive design
3. ✅ **Minimalist Backend**: Only computation, no decryption
4. ✅ **Core Demo**: Single-button flow, no extra features

## 📝 License

MIT

## 🔗 Links

- **Zama Docs**: https://docs.zama.org/fhevm
- **Sepolia Explorer**: https://sepolia.etherscan.io/
- **FHEVM v0.9**: https://docs.zama.org/protocol

---

**Built with ❤️ using FHEVM v0.9**

