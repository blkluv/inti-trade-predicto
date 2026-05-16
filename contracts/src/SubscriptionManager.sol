// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract SubscriptionManager is Ownable, ReentrancyGuard {
    IERC20 public usdc;

    enum Tier { FREE, PRO, ENTERPRISE }

    struct Subscription {
        Tier tier;
        uint256 expiry;
        bool active;
    }

    mapping(address => Subscription) public subscribers;
    mapping(Tier => uint256) public tierPrices;
    mapping(Tier => uint256) public tierDuration;

    event Subscribed(address indexed user, Tier tier, uint256 expiry);
    event Cancelled(address indexed user);
    event TierPriceUpdated(Tier tier, uint256 newPrice);
    event USDCWithdrawn(address indexed to, uint256 amount);

    constructor(address _usdc) Ownable(msg.sender) {
        usdc = IERC20(_usdc);
        tierPrices[Tier.PRO] = 9.99 * 1e6;
        tierPrices[Tier.ENTERPRISE] = 99.99 * 1e6;
        tierDuration[Tier.PRO] = 30 days;
        tierDuration[Tier.ENTERPRISE] = 30 days;
    }

    function subscribe(Tier tier) external nonReentrant {
        require(tier != Tier.FREE, "Use free tier directly");
        require(tierPrices[tier] > 0, "Invalid tier");

        usdc.transferFrom(msg.sender, address(this), tierPrices[tier]);

        uint256 expiry = block.timestamp + tierDuration[tier];
        subscribers[msg.sender] = Subscription(tier, expiry, true);

        emit Subscribed(msg.sender, tier, expiry);
    }

    function cancel() external {
        require(subscribers[msg.sender].active, "No active sub");
        subscribers[msg.sender].active = false;
        emit Cancelled(msg.sender);
    }

    function isActive(address user) external view returns (bool) {
        Subscription memory sub = subscribers[user];
        return sub.active && block.timestamp < sub.expiry;
    }

    function getUserTier(address user) external view returns (Tier) {
        Subscription memory sub = subscribers[user];
        if (sub.active && block.timestamp < sub.expiry) {
            return sub.tier;
        }
        return Tier.FREE;
    }

    function setTierPrice(Tier tier, uint256 price) external onlyOwner {
        tierPrices[tier] = price;
        emit TierPriceUpdated(tier, price);
    }

    function withdrawUSDC(address to) external onlyOwner {
        uint256 balance = usdc.balanceOf(address(this));
        require(balance > 0, "No USDC to withdraw");
        usdc.transfer(to, balance);
        emit USDCWithdrawn(to, balance);
    }
}
