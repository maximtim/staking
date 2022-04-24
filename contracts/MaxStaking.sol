//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "../contracts/IERC20.sol";

contract MaxStaking {
    IERC20 public tokenRewards;
    IERC20 public tokenStake;
    uint public rewardPeriod;
    uint public frozenPeriod;
    uint public rewardFor1TokenUnit;
    uint public tokenRewardDecimals;
    address public owner;

    struct Stake {
        uint tokenAmount;
        uint creationTime;
        uint reward;
        uint rewardsCount;
    }

    mapping (address => Stake) public stakes;

    constructor(
        address tokenStake_, 
        address tokenRewards_,
        uint rewardPeriod_,
        uint frozenPeriod_,
        uint rewardFor1TokenUnit_,
        uint tokenRewardDecimals_) {
        require(rewardPeriod_ > 0, "Reward period should be > 0");
        require(rewardFor1TokenUnit_ > 0, "Reward percent should be > 0");
        require(tokenRewardDecimals_ > 0, "Decimals should be > 0");

        owner = msg.sender;
        tokenRewards = IERC20(tokenRewards_);
        tokenStake = IERC20(tokenStake_);
        rewardPeriod = rewardPeriod_;
        frozenPeriod = frozenPeriod_;
        rewardFor1TokenUnit = rewardFor1TokenUnit_;
        tokenRewardDecimals = tokenRewardDecimals_;
    }

    modifier onlyOwner {
        require(msg.sender == owner, "Only owner");
        _;
    }

    modifier greaterThanZero(uint arg) {
        require(arg > 0, "Greater than zero only");
        _;
    }

    ////////////////////////////////////////////////////////////////////////////////

    function stake(uint amount) external {
        require(amount > 0, "Stake == 0");
        tokenStake.transferFrom(msg.sender, address(this), amount);

        Stake storage stakeStorage = stakes[msg.sender];

        if (stakeStorage.tokenAmount == 0){
            stakeStorage.creationTime = block.timestamp;
            stakeStorage.rewardsCount = 0; // important
        }
        stakeStorage.tokenAmount += amount;
    }

    function claim() external {
        Stake storage stakeStorage = stakes[msg.sender];
        Stake memory stakeMemory = stakeStorage;
        require(stakeMemory.creationTime > 0, "Stake was not created");
        require(stakeMemory.creationTime + frozenPeriod < block.timestamp, "Frozen period is not over yet");

        (uint reward, uint rewardsCount) = _calculateReward(stakeMemory);

        require(reward > 0, "No reward to claim");
        stakeStorage.reward = 0;
        stakeStorage.rewardsCount = rewardsCount;

        tokenRewards.transfer(msg.sender, reward);
    }

    function unstake() external {
        Stake storage stakeStorage = stakes[msg.sender];
        Stake memory stakeMemory = stakeStorage;
        uint amount = stakeMemory.tokenAmount;
        require(amount > 0, "Nothing to unstake");

        _updateReward(stakeStorage, stakeMemory);

        stakeStorage.tokenAmount = 0;
        tokenStake.transfer(msg.sender, amount);
    }

    ////////////////////////////////////////////////////////////////////////////////

    function update() external {
        Stake storage stakeStorage = stakes[msg.sender];
        Stake memory stakeMemory = stakeStorage;
        _updateReward(stakeStorage, stakeMemory);
    }

    function changeFrozenPeriod(uint frozenPeriod_) external onlyOwner {
        frozenPeriod = frozenPeriod_;
    }

    function changeRewardFor1TokenUnit(uint rewardFor1TokenUnit_) external 
        onlyOwner 
        greaterThanZero(rewardFor1TokenUnit_) 
    {
        rewardFor1TokenUnit = rewardFor1TokenUnit_;
    }

    ////////////////////////////////////////////////////////////////////////////////

    function _calculateReward(Stake memory stakeMemory) 
        private 
        view 
        returns (uint fullReward, uint fullRewardsCount) 
    {    
        uint newRewardsCount = (block.timestamp - stakeMemory.creationTime) / rewardPeriod;
        uint oldCount = stakeMemory.rewardsCount;

        fullReward = stakeMemory.reward + (newRewardsCount - oldCount) * rewardFor1TokenUnit * stakeMemory.tokenAmount / (10**tokenRewardDecimals);
        fullRewardsCount = newRewardsCount;
    }

    function _updateReward(Stake storage stakeStorage, Stake memory stakeMemory) private {
        (uint reward, uint rewardsCount) = _calculateReward(stakeMemory);

        if (rewardsCount > stakeMemory.rewardsCount){
            stakeStorage.reward = reward;
            stakeStorage.rewardsCount = rewardsCount;
        }
    }
}