// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {ZamaEthereumConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/**
 * @title SecretCrowdfunding
 * @notice 保密众筹合约 - 用户金额完全加密存储
 * @dev 遵循 FHEVM v0.9 最佳实践：只计算，不解密
 */
contract SecretCrowdfunding is ZamaEthereumConfig {
    // 存储用户的加密众筹金额
    mapping(address => euint32) public userCommitments;
    
    // 标记用户是否已提交
    mapping(address => bool) public hasCommitted;
    
    // 记录提交时间戳
    mapping(address => uint256) public commitmentTimestamp;
    
    // 事件：用户提交承诺
    event CommitmentSubmitted(address indexed user, uint256 timestamp);
    
    /**
     * @notice 提交加密的众筹金额
     * @param encryptedAmount 加密的金额（euint32）
     * @param proof 零知识证明
     */
    function submitCommitment(
        externalEuint32 encryptedAmount,
        bytes calldata proof
    ) external {
        // 1. 验证并转换外部加密输入
        euint32 amount = FHE.fromExternal(encryptedAmount, proof);
        
        // 2. 存储加密金额
        userCommitments[msg.sender] = amount;
        hasCommitted[msg.sender] = true;
        commitmentTimestamp[msg.sender] = block.timestamp;
        
        // 3. 双重授权（关键！）
        FHE.allowThis(amount);         // 合约可以返回 handle
        FHE.allow(amount, msg.sender); // 用户可以解密
        
        // 4. 触发事件
        emit CommitmentSubmitted(msg.sender, block.timestamp);
    }
    
    /**
     * @notice 获取我的加密承诺（返回 handle）
     * @return bytes32 加密数据的句柄
     */
    function getMyCommitment() external view returns (bytes32) {
        require(hasCommitted[msg.sender], "You have not submitted a commitment yet");
        return FHE.toBytes32(userCommitments[msg.sender]);
    }
    
    /**
     * @notice 获取我的提交时间戳
     * @return uint256 提交时间
     */
    function getMyCommitmentTimestamp() external view returns (uint256) {
        require(hasCommitted[msg.sender], "You have not submitted a commitment yet");
        return commitmentTimestamp[msg.sender];
    }
    
    /**
     * @notice 检查用户是否已提交
     * @param user 用户地址
     * @return bool 是否已提交
     */
    function hasUserCommitted(address user) external view returns (bool) {
        return hasCommitted[user];
    }
}

