## Staking contract

You can stake UNI-V2 tokens of given pair (see .env example) and collect 0.01 MAXT reward token per 1 UNI token every 1 minute, until unstake. You can claim reward tokens at any time.

#### 1) Hardhat tasks:
|Command|Description|
|---------------------------------|-------------------------------------------------|
| - staking-claim        | Claim reward tokens from MaxStaking contract |
| - staking-getstake     | Get your stake info |
| - staking-info         | Staking contract info |
| - staking-stake        | Stake tokens into MaxStaking contract |
| - staking-unstake      | Unstake tokens from staking contract |
| - staking-update       | Update your stake info |
| Misc.: |  |
| - add-liquidity-eth    | Create pool (WETH-MAXT) if it doesn't exist and add liquidity there |
| - get-pair-address     | Get Uniswap pair address for two tokens addresses |

Add "--help" to these commands to see explanations.

#### 2) Deploy script to rinkeby network 

`rewardFor1TokenUnit` is a number of MAXT token atoms (with `tokenRewardDecimals` as MAXT decimals) given every `rewardPeriod` seconds for each 1 UNI token unit of your stake. You can unstake tokens only after `frozenPeriod` seconds.

- Windows:
```
> $env:HARDHAT_NETWORK='rinkeby'
> npx ts-node scripts/deploy.ts --tokenStake 0x6553bA4996f0E2fF0CB98be3086dD8e27EEd5345 --tokenRewards 0xC3351cFA43384384B855745767eea947214AA264 --rewardPeriod 60 --frozenPeriod 300 --rewardFor1TokenUnit 10000000000000000 --tokenRewardDecimals 18
```
- Linux: 
```
>  HARDHAT_NETWORK=rinkeby npx ts-node scripts/deploy.ts --tokenStake 0x6553bA4996f0E2fF0CB98be3086dD8e27EEd5345 --tokenRewards 0xC3351cFA43384384B855745767eea947214AA264 --rewardPeriod 60 --frozenPeriod 300 --rewardFor1TokenUnit 10000000000000000 --tokenRewardDecimals 18
```

#### 3) Tests (solidity-coverage 100%)
#### 4) Etherscan verification
```
> npx hardhat verify --network rinkeby 0xEBB79890E3C2C0806fA947EEDe2486131D87316F 0x6553bA4996f0E2fF0CB98be3086dD8e27EEd5345 0xC3351cFA43384384B855745767eea947214AA264 60 300 10000000000000000 18
```
https://rinkeby.etherscan.io/address/0xEBB79890E3C2C0806fA947EEDe2486131D87316F#code
#### 5) .env settings:
```
PROJECT_URL="https://rinkeby.infura.io/v3/<project id here>"
PRIVATE_KEYS_LIST=["<pk0>","<pk1>","<pk2>",...]
ETHERSCAN_API_KEY=<api-key>

#########################################################################
# These are fixed for rinkeby
UNISWAP_ROUTER_ADDRESS=0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
PAIR_ADDRESS=0x6553bA4996f0E2fF0CB98be3086dD8e27EEd5345

MAXTOKEN_ADDRESS=0xC3351cFA43384384B855745767eea947214AA264
WETH_ADDRESS=0xc778417E063141139Fce010982780140Aa0cD5Ab

STAKING_ADDRESS=0xEBB79890E3C2C0806fA947EEDe2486131D87316F
#########################################################################
```

