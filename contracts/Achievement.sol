// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title CastChain Narratives Achievement Contract
 * @dev 用于铸造创作者成就的NFT/SBT合约
 */
contract CastChainAchievement is ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    // 成就类型
    enum AchievementType {
        BRANCH_CREATOR,    // 分支开创者SBT
        CHAPTER_COMPLETER, // 章节完成NFT
        STORY_CONTRIBUTOR, // 故事贡献者NFT
        COMMUNITY_BUILDER, // 社区建设者SBT
        NARRATIVE_PIONEER  // 叙事先锋SBT
    }

    // 成就元数据
    struct Achievement {
        AchievementType achievementType;
        string metadataURI;
        uint256 narrativeId;
        bool soulbound;    // 是否为SBT (不可转让)
    }

    // tokenId => Achievement
    mapping(uint256 => Achievement) public achievements;

    // 授权的铸造者
    mapping(address => bool) public authorizedMinters;

    // 防重复铸造：用户地址 => 成就类型 => 是否已铸造
    mapping(address => mapping(AchievementType => bool)) public hasMinted;

    // 事件
    event AchievementMinted(
        address indexed recipient,
        uint256 indexed tokenId,
        AchievementType achievementType,
        uint256 narrativeId
    );

    constructor() ERC721("CastChain Achievement", "CCA") {
        authorizedMinters[msg.sender] = true;
    }

    // 公开铸造成就 (任何人都可以调用)
    function publicMintAchievement(
        address recipient,
        AchievementType achievementType,
        string memory metadataURI,
        uint256 narrativeId,
        bool soulbound
    ) external returns (uint256) {
        // 防重复铸造检查
        require(!hasMinted[recipient][achievementType], "Achievement already minted for this type");

        _tokenIds.increment();
        uint256 newTokenId = _tokenIds.current();

        _safeMint(recipient, newTokenId);

        achievements[newTokenId] = Achievement({
            achievementType: achievementType,
            metadataURI: metadataURI,
            narrativeId: narrativeId,
            soulbound: soulbound
        });

        // 标记为已铸造
        hasMinted[recipient][achievementType] = true;

        emit AchievementMinted(recipient, newTokenId, achievementType, narrativeId);

        return newTokenId;
    }

    // 获取成就元数据URI
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(_ownerOf(tokenId) != address(0), "URI query for nonexistent token");
        return achievements[tokenId].metadataURI;
    }

    // 获取成就类型
    function getAchievementType(uint256 tokenId) external view returns (AchievementType) {
        require(_ownerOf(tokenId) != address(0), "Query for nonexistent token");
        return achievements[tokenId].achievementType;
    }

    // 判断是否为SBT (灵魂绑定代币)
    function isSoulbound(uint256 tokenId) external view returns (bool) {
        require(_ownerOf(tokenId) != address(0), "Query for nonexistent token");
        return achievements[tokenId].soulbound;
    }

    // 重写转移函数，加入SBT限制
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 firstTokenId,
        uint256 batchSize
    ) internal override {
        super._beforeTokenTransfer(from, to, firstTokenId, batchSize);

        // 如果不是铸造操作，检查批量转移中的所有代币是否为SBT
        if (from != address(0)) {
            for (uint256 i = 0; i < batchSize; i++) {
                uint256 tokenId = firstTokenId + i;
                if (achievements[tokenId].soulbound) {
                    revert("This achievement is soulbound and cannot be transferred");
                }
            }
        }
    }

    // 获取用户所有成就
    function getAchievementsOfOwner(address owner) external view returns (uint256[] memory) {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](balance);

        for (uint256 i = 0; i < balance; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }

        return tokenIds;
    }

    // 检查用户是否已经铸造了某种类型的成就
    function hasUserMinted(address user, AchievementType achievementType) external view returns (bool) {
        return hasMinted[user][achievementType];
    }
}