import { CalculatorInputs, CalculationResults } from "@/types/calculator";

/**
 * Calcula os custos de produção e preços de venda de uma peça impressa.
 *
 * O cálculo considera custos diretos (filamento, energia elétrica, desgaste da
 * impressora, mão‑de‑obra, manutenção) e aplica multiplicadores de
 * complexidade, taxa de falha, margem de lucro e taxas adicionais.
 * Novos campos foram adicionados para fornecer lucro e preço final por peça.
 */
export const calculateCosts = (inputs: CalculatorInputs): CalculationResults => {
  // Converter tempo total de impressão para horas decimais
  const printTime = inputs.printTimeHours + inputs.printTimeMinutes / 60;

  // Custo do filamento (preço por kg → preço por g × gramas utilizadas)
  const filamentCost = (inputs.filamentPrice / 1000) * inputs.filamentUsed;

  // Custo de energia (potência em W → kW × horas × tarifa)
  const energyConsumption = (inputs.printerPower / 1000) * printTime;
  const energyCost = energyConsumption * inputs.energyRate;

  // Custo de desgaste da impressora (valor da impressora dividido pela vida útil).
  // Se a vida útil for zero ou não informada, evitamos divisão por zero atribuindo custo zero.
  let wearCost = 0;
  if (inputs.printerLifespan && inputs.printerLifespan > 0) {
    wearCost = (inputs.printerValue / inputs.printerLifespan) * printTime;
  } else {
    wearCost = 0;
  }

  // Custo de mão‑de‑obra (valor por hora × horas de trabalho ativo)
  const laborCost = inputs.hourlyRate * inputs.activeWorkTime;

  // Custo de manutenção (custo por hora × horas de impressão)
  const maintenanceTotalCost = inputs.maintenanceCost * printTime;

  // Multiplicador de complexidade
  const complexityMultipliers = {
    simple: 1.0,
    intermediate: 1.15,
    high: 1.35,
  } as const;
  const complexityMultiplier = complexityMultipliers[inputs.complexity];

  // Cálculo do custo com complexidade:
  // em vez de multiplicar todo o custo base, aplicamos o multiplicador
  // apenas aos custos relacionados à impressão (filamento, energia, desgaste e manutenção).
  const printRelatedCost = filamentCost + energyCost + wearCost + maintenanceTotalCost;
  const costWithComplexity = printRelatedCost * complexityMultiplier + laborCost + inputs.finishingCost;

  // Custo de falha (percentual do custo já ajustado pela complexidade)
  const failureCost = costWithComplexity * (inputs.failureRate / 100);

  // Custo total de produção
  const productionCost = costWithComplexity + failureCost;

  // Custo de produção por unidade
  const quantity = inputs.quantity > 0 ? inputs.quantity : 1;
  const costPerUnit = productionCost / quantity;

  // Margem de lucro total (valor absoluto)
  const profitAmount = productionCost * (inputs.profitMargin / 100);
  // Lucro por unidade
  const profitPerUnit = profitAmount / quantity;

  // Preço final sem taxa
  const finalPrice = productionCost + profitAmount;

  // Preço final com taxa adicional de marketplace (caso exista)
  const finalPriceWithFee = finalPrice * (1 + inputs.additionalFee / 100);
  // Preço final por unidade (incluindo margem e taxa)
  const finalPricePerUnit = finalPriceWithFee / quantity;

  // Tempo total (impressão + trabalho ativo)
  const totalTime = printTime + inputs.activeWorkTime;

  return {
    filamentCost,
    energyCost,
    wearCost,
    laborCost,
    maintenanceTotalCost,
    failureCost,
    complexityMultiplier,
    productionCost,
    costPerUnit,
    profitAmount,
    finalPrice,
    finalPriceWithFee,
    totalTime,
    profitPerUnit,
    finalPricePerUnit,
  };
};