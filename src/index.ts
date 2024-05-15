import { ethers } from "ethers";
import { _abi as bridgeABI, usdc_abi } from "./consts";
const userWallet = new ethers.Wallet("KEY");

const sourceChain = "base";
const destChain = "arb";

// const amountUsdc = ethers.parseUnits("0.1", 6); // 0.1 USDC

// convert it to Number

const amountUsdc = Number(1000000);

const needToApprove = true;
const needToSend = true;

const USDC_CONTRACT_ADDRESS = {
  base: "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
  arb: "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
};

const USDC_BRIDGE_CONTRACT_ADDRESSES = {
  base: "0x165cCA33885384a4823A45f65077565C36F1908A",
  arb: "0x94978ea58eBfe46301A5Fa9521819c7090f01f40",
};

const chain_id = {
  base: 10004,
  arb: 10003,
};

const RPC_URL = {
  base: "https://rpc.ankr.com/base_sepolia",
  arb: "https://rpc.ankr.com/arbitrum_sepolia",
};

const provider = new ethers.JsonRpcProvider(RPC_URL[sourceChain]);
const signer = userWallet.connect(provider);

const usdcContract = new ethers.Contract(
  USDC_CONTRACT_ADDRESS[sourceChain],
  usdc_abi,
  signer
);

const bridgeContract = new ethers.Contract(
  USDC_BRIDGE_CONTRACT_ADDRESSES[sourceChain],
  bridgeABI,
  signer
);

if (needToApprove) {
  const approveTx = await usdcContract
    .approve(USDC_BRIDGE_CONTRACT_ADDRESSES[sourceChain], amountUsdc)
    .then((tx) => tx.wait());

  console.log("Approved USDC", approveTx.hash);
}

const quoteFeesToBridge = (await bridgeContract.quoteCrossChainDeposit(
  chain_id[destChain]
)) as Number;

console.log("Quote Fees", quoteFeesToBridge);

if (needToSend) {
  const sendUSDCTx = await bridgeContract.sendCrossChainDeposit(
    chain_id[destChain],
    USDC_BRIDGE_CONTRACT_ADDRESSES[destChain],
    userWallet.address,
    amountUsdc,
    {
      value: quoteFeesToBridge,
    }
  );

  console.log("Send USDC", sendUSDCTx.hash);
}

const arbProvider = new ethers.JsonRpcProvider(RPC_URL[destChain]);
const arbSigner = userWallet.connect(arbProvider);

const arbUsdcContract = new ethers.Contract(
  USDC_CONTRACT_ADDRESS[destChain],
  usdc_abi,
  arbSigner
);

// check balance
const balance = await arbUsdcContract.balanceOf(userWallet.address);

// format balance
const formattedBalance = ethers.formatUnits(balance, 6);

console.log("Balance", formattedBalance);
