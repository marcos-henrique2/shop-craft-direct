import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalculatorInputs, CalculationResults } from "@/types/calculator";
import { Badge } from "@/components/ui/badge";
// Removidos 'AlertCircle' e 'CheckCircle2' por enquanto para simplificar
// e garantir que o código funcione, já que 'desiredPriceMargin' não é retornado pela sua função de cálculo.

interface ResultsDisplayProps {
  inputs: CalculatorInputs;
  results: CalculationResults;
}

// Helper para formatar moeda
const formatCurrency = (value: number) => `R$ ${value.toFixed(2)}`;

export const ProductResultsDisplay = ({ inputs, results }: ResultsDisplayProps) => {
  
  // --- CORREÇÃO: Lista de variáveis alinhada com 'utils/calculator.ts' ---
  const { 
    filamentCost, 
    energyCost, 
    laborCost, 
    wearCost, // Em vez de 'depreciationCost'
    maintenanceTotalCost, // Em vez de 'maintenanceCost'
    failureCost,
    productionCost,
    costPerUnit,
    profitAmount, // Em vez de 'profitMarginValue'
    finalPrice, // Em vez de 'priceBeforeFees'
    finalPriceWithFee,
  } = results;

  // Calculamos a taxa aqui, já que ela não é retornada diretamente
  const additionalFeeValue = finalPriceWithFee - finalPrice;

  return (
    <div className="space-y-4">
      {/* Preço Final */}
      <Card className="border-primary border-2 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl text-primary">Preço de Venda Final (Unidade)</CardTitle>
        </CardHeader>
        <CardContent>
          {/* --- CORREÇÃO: Usando 'finalPriceWithFee' que é o preço por unidade da sua função --- */}
          <p className="text-5xl font-bold text-primary">{formatCurrency(results.finalPricePerUnit)}</p>
        </CardContent>
      </Card>
      
      {/* Comparação de Preço Desejado (Removido por enquanto, pois 'desiredPriceMargin' não existe em 'results') */}
      {/* Se você quiser esta funcionalidade, teremos que adicioná-la ao 'utils/calculator.ts' depois */}

      {/* Detalhamento de Custos */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Detalhamento de Custos</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Custo de Filamento:</span>
            <span className="font-medium">{formatCurrency(filamentCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Custo de Energia:</span>
            <span className="font-medium">{formatCurrency(energyCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Mão de Obra (Ativa):</span>
            <span className="font-medium">{formatCurrency(laborCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Depreciação da Impressora:</span>
            {/* --- CORREÇÃO: Usando 'wearCost' --- */}
            <span className="font-medium">{formatCurrency(wearCost)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Custo de Manutenção:</span>
            {/* --- CORREÇÃO: Usando 'maintenanceTotalCost' --- */}
            <span className="font-medium">{formatCurrency(maintenanceTotalCost)}</span>
          </div>
          
          {/* Custo de acabamento não está no seu 'utils/calculator.ts' como um valor de retorno, 
              mas está nos inputs. Vamos pular a exibição dele por enquanto. */}
          
          <div className="flex justify-between">
            <span className="text-muted-foreground">Custo de Falha ({inputs.failureRate}%):</span>
            <span className="font-medium">{formatCurrency(failureCost)}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-2 border-t">
            <span>Custo de Produção Total:</span>
            <span>{formatCurrency(productionCost)}</span>
          </div>
        </CardContent>
      </Card>

      {/* Detalhamento do Preço */}
      <Card className="bg-muted/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Detalhamento do Preço</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Custo por Unidade:</span>
            <span className="font-medium">{formatCurrency(costPerUnit)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Margem de Lucro ({inputs.profitMargin}%):</span>
            {/* --- CORREÇÃO: Usando 'profitAmount' --- */}
            <span className="font-medium">{formatCurrency(profitAmount)}</span>
          </div>
          <div className="flex justify-between border-t pt-2 mt-2">
            <span className="text-muted-foreground">Preço (sem taxas):</span>
            {/* --- CORREÇÃO: Usando 'finalPrice' --- */}
            <span className="font-medium">{formatCurrency(finalPrice)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Taxa Adicional ({inputs.additionalFee}%):</span>
            {/* --- CORREÇÃO: Usando o valor calculado 'additionalFeeValue' --- */}
            <span className="font-medium">{formatCurrency(additionalFeeValue)}</span>
          </div>
          <div className="flex justify-between font-bold text-base pt-2 border-t">
            <span>Preço Final (Unidade):</span>
            {/* --- CORREÇÃO: Usando 'finalPricePerUnit' --- */}
            <span className="font-medium">{formatCurrency(results.finalPricePerUnit)}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};