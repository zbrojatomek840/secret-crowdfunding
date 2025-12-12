'use client';

import { useState, useEffect, useRef } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ethers, BrowserProvider } from 'ethers';

// 合约配置（已部署到 Sepolia）
const CONTRACT_ADDRESS = '0xe2dbd48f9fcfbf30bff433f5e30258ab7040e94b';
const CONTRACT_ABI = [
  "function submitCommitment(bytes32, bytes) external",
  "function getMyCommitment() external view returns (bytes32)",
  "function hasCommitted(address user) external view returns (bool)",
  "event CommitmentSubmitted(address indexed user, uint256 timestamp)"
];

// FHEVM v0.9 配置（7个必需参数）
const FHEVM_CONFIG = {
  chainId: 11155111,  // Sepolia
  aclContractAddress: '0xf0Ffdc93b7E186bC2f8CB3dAA75D86d1930A433D',
  kmsContractAddress: '0xbE0E383937d564D7FF0BC3b46c51f0bF8d5C311A',
  inputVerifierContractAddress: '0xBBC1fFCdc7C316aAAd72E807D9b0272BE8F84DA0',
  verifyingContractAddressDecryption: '0x5D8BD78e2ea6bbE41f26dFe9fdaEAa349e077478',
  verifyingContractAddressInputVerification: '0x483b9dE06E4E4C7D35CCf5837A1668487406D955',
  gatewayChainId: 10901,
  relayerUrl: 'https://relayer.testnet.zama.org',
};

export default function DAppPage() {
  const { isConnected, address } = useAccount();
  const { data: walletClient } = useWalletClient();
  
  const [fhevmInstance, setFhevmInstance] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [amount, setAmount] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedAmount, setDecryptedAmount] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [canDecrypt, setCanDecrypt] = useState(false);
  
  const isInitializingRef = useRef(false);

  // 初始化 FHEVM
  useEffect(() => {
    if (!isConnected || !address || !walletClient || fhevmInstance || isInitializingRef.current) {
      return;
    }

    const initFhevm = async () => {
      isInitializingRef.current = true;
      setIsInitializing(true);
      setError(null);

      try {
        // 等待 relayerSDK 加载
        if (!(window as any).relayerSDK) {
          throw new Error('Relayer SDK not loaded');
        }

        // 初始化 SDK
        await (window as any).relayerSDK.initSDK();

        // 创建实例
        const instance = await (window as any).relayerSDK.createInstance({
          ...FHEVM_CONFIG,
          network: walletClient,
        });

        setFhevmInstance(instance);
        console.log('✅ FHEVM initialized successfully');
      } catch (e: any) {
        setError(e.message);
        console.error('❌ FHEVM init failed:', e);
        isInitializingRef.current = false;
      } finally {
        setIsInitializing(false);
      }
    };

    initFhevm();
  }, [isConnected, address, walletClient, fhevmInstance]);

  // 提交加密金额
  const handleSubmit = async () => {
    if (!fhevmInstance || !walletClient || !amount) return;

    setIsSubmitting(true);
    setError(null);
    setDecryptedAmount(null);
    setCanDecrypt(false);

    try {
      const amountNum = parseInt(amount);
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error('Please enter a valid amount');
      }

      console.log('🔐 Encrypting amount...');
      
      // 1. 加密输入
      const input = fhevmInstance.createEncryptedInput(CONTRACT_ADDRESS, address);
      input.add32(amountNum);
      const encryptedInput = await input.encrypt();

      // 2. 创建合约实例
      const provider = new BrowserProvider(walletClient as any);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      console.log('📤 Submitting to contract...');
      
      // 3. 提交到合约（两个参数：handle 和 proof）
      const tx = await contract.submitCommitment(
        encryptedInput.handles[0],
        encryptedInput.inputProof
      );

      console.log('⏳ Waiting for confirmation...');
      await tx.wait();

      console.log('✅ Transaction confirmed!');

      // 4. 开始倒计时（10秒）
      setCountdown(10);
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanDecrypt(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (e: any) {
      console.error('❌ Submit failed:', e);
      setError(e.message || 'Submit failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 解密金额
  const handleDecrypt = async () => {
    if (!fhevmInstance || !walletClient) return;

    setIsDecrypting(true);
    setError(null);

    try {
      console.log('🔓 Decrypting amount...');

      // 1. 创建合约实例
      const provider = new BrowserProvider(walletClient as any);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

      // 2. 获取加密的 handle
      const encryptedHandle = await contract.getMyCommitment();
      console.log('📦 Encrypted handle:', encryptedHandle);

      // 3. 生成密钥对
      const keypair = fhevmInstance.generateKeypair();

      // 4. 准备解密参数
      const handleContractPairs = [
        { handle: encryptedHandle, contractAddress: CONTRACT_ADDRESS }
      ];
      const startTimeStamp = Math.floor(Date.now() / 1000).toString();
      const durationDays = "10";
      const contractAddresses = [CONTRACT_ADDRESS];

      // 5. 创建 EIP-712 签名消息
      const eip712 = fhevmInstance.createEIP712(
        keypair.publicKey,
        contractAddresses,
        startTimeStamp,
        durationDays
      );

      // 6. 用户签名授权
      const typesWithoutDomain = { ...eip712.types };
      delete typesWithoutDomain.EIP712Domain;

      console.log('✍️ Requesting signature...');
      const signature = await signer.signTypedData(
        eip712.domain,
        typesWithoutDomain,
        eip712.message
      );

      console.log('🔓 Calling userDecrypt... (may take 30-60s)');

      // 7. 调用 userDecrypt 解密
      const decryptedResults = await fhevmInstance.userDecrypt(
        handleContractPairs,
        keypair.privateKey,
        keypair.publicKey,
        signature.replace("0x", ""),
        contractAddresses,
        address,
        startTimeStamp,
        durationDays
      );

      // 8. 提取解密结果
      const decryptedValue = decryptedResults[encryptedHandle];
      console.log('✅ Decrypted amount:', decryptedValue);

      setDecryptedAmount(decryptedValue);
    } catch (e: any) {
      console.error('❌ Decrypt failed:', e);
      setError(e.message || 'Decrypt failed');
    } finally {
      setIsDecrypting(false);
    }
  };

  // 未连接状态
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-6">🔒</div>
          <h2 className="text-2xl font-bold mb-4">Connect Your Wallet</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Connect your wallet to start making private commitments
          </p>
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>
      </div>
    );
  }

  // 初始化中
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-gray-800 dark:text-gray-200">Initializing FHEVM...</p>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
            This may take a few seconds
          </p>
        </div>
      </div>
    );
  }

  // 主界面
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900 p-4">
      <div className="container mx-auto max-w-2xl py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🔒 Secret Crowdfunding
          </h1>
          <ConnectButton />
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8">
          {/* Status Badge */}
          <div className="flex items-center justify-center mb-6">
            <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-4 py-2 rounded-full text-sm font-semibold">
              ✅ FHEVM Ready
            </div>
          </div>

          {/* Input Section */}
          <div className="mb-8">
            <label className="block text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
              Commitment Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount, e.g. 5000"
              disabled={isSubmitting || countdown > 0}
              className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 focus:border-blue-500 focus:outline-none text-lg disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Your amount will be fully encrypted on-chain
            </p>
          </div>

          {/* Submit Button */}
          {!canDecrypt && decryptedAmount === null && (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !amount || countdown > 0}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </span>
              ) : (
                '🔐 Submit Commitment'
              )}
            </button>
          )}

          {/* Countdown */}
          {countdown > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mt-4">
              <div className="flex items-center gap-3">
                <div className="text-2xl">⏳</div>
                <div className="flex-1">
                  <p className="font-semibold text-amber-900 dark:text-amber-300 mb-1">
                    Syncing permissions... {countdown}s
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-400">
                    Waiting for blockchain to sync permission data
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Decrypt Button */}
          {canDecrypt && decryptedAmount === null && (
            <button
              onClick={handleDecrypt}
              disabled={isDecrypting}
              className="w-full bg-gradient-to-r from-green-600 to-teal-600 text-white font-semibold py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {isDecrypting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Decrypting... (may take 30-60s)
                </span>
              ) : (
                '🔓 Decrypt Amount'
              )}
            </button>
          )}

          {/* Result */}
          {decryptedAmount !== null && (
            <div className="bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-6 mt-6">
              <div className="text-center">
                <div className="text-5xl mb-4">🎉</div>
                <h3 className="text-lg font-semibold text-green-900 dark:text-green-300 mb-2">
                  Your Commitment Amount
                </h3>
                <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-4">
                  {decryptedAmount.toLocaleString()}
                </div>
                <p className="text-sm text-green-800 dark:text-green-400">
                  Successfully decrypted! Only you can see this amount.
                </p>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mt-4">
              <div className="flex items-start gap-3">
                <div className="text-xl">❌</div>
                <div>
                  <p className="font-semibold text-red-900 dark:text-red-300 mb-1">
                    Error
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-400">
                    {error}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mt-6">
            <div className="flex items-start gap-3">
              <div className="text-xl">💡</div>
              <div className="text-sm text-blue-900 dark:text-blue-300">
                <p className="font-semibold mb-1">How It Works</p>
                <ul className="space-y-1 text-xs">
                  <li>✅ Your amount is encrypted in your browser</li>
                  <li>✅ Encrypted data is submitted on-chain</li>
                  <li>✅ Only you can decrypt and view the amount</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Contract Info */}
        <div className="text-center mt-8 text-sm text-gray-500 dark:text-gray-400">
          <p>Contract: {CONTRACT_ADDRESS}</p>
          <p className="mt-1">Network: Sepolia Testnet</p>
        </div>
      </div>
    </div>
  );
}

// 禁用静态生成
export const dynamic = 'force-dynamic';

