export function getGasCost(txRes: any) {
  return txRes.gasUsed.mul(txRes.effectiveGasPrice);
}