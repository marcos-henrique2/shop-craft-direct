export interface CalculatorInputs {
  // Dados do Cliente
  clientName?: string; // <--- Campo adicionado

  // Dados da Peça
  pieceName: string;
  quantity: number;
  material: string;
  manualPainting: boolean;

  // Parâmetros da Impressão
  filamentPrice: number;
  filamentUsed: number;
  printTimeHours: number;
  printTimeMinutes: number;
  printerPower: number;
  energyRate: number;
  printerValue: number;
  printerLifespan: number;

  // Trabalho e Estratégia
  hourlyRate: number;
  activeWorkTime: number;
  finishingCost: number;
  maintenanceCost: number;
  failureRate: number;
  complexity: 'simple' | 'intermediate' | 'high';
  profitMargin: number;

  // Taxas
  additionalFee: number;

  // Comparação de Preço (opcional)
  desiredPrice?: number;
}

export interface CalculationResults {
  // Custos detalhados
  filamentCost: number;
  energyCost: number;
  wearCost: number;
  laborCost: number;
  maintenanceTotalCost: number;
  failureCost: number;
  complexityMultiplier: number;

  // Totais
  productionCost: number;
  costPerUnit: number;
  profitAmount: number;
  finalPrice: number;
  finalPriceWithFee: number;
  totalTime: number;

  // Novos campos
  /** Lucro líquido por unidade */
  profitPerUnit: number;

  /** Preço final por unidade (com margem e taxa) */
  finalPricePerUnit: number;
}

export interface Quote {
  id: string;
  created_at: string;
  user_id: string;
  client_name: string | null;
  piece_name: string | null;
  inputs_data: CalculatorInputs;
  results_data: CalculationResults;
}

// ADICIONE ESTA NOVA INTERFACE NO FINAL DO ARQUIVO
export interface Quote {
  id: string;
  created_at: string;
  user_id: string;
  client_name: string | null;
  piece_name: string | null;
  inputs_data: CalculatorInputs;
  results_data: CalculationResults;
}