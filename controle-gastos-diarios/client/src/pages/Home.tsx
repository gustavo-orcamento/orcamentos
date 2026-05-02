import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, TrendingDown, TrendingUp, Settings, DollarSign, Calendar } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Design: Minimalismo Funcional com Foco em Dados
 * - Números grandes e legíveis dominam a interface
 * - Paleta neutra com acentos em verde para saldo positivo
 * - Tipografia de contraste alto: Poppins para números, Inter para labels
 * - Espaço negativo generoso entre seções
 */

interface DailyExpense {
  date: string;
  amount: number;
  description: string;
}

interface IncomeEntry {
  date: string;
  amount: number;
  description: string;
}

interface BudgetConfig {
  totalBudget: number;
  endDate: string; // YYYY-MM-DD
  fixedBudget: boolean; // Se true, ignora renda e usa apenas o orçamento total
}

const DEFAULT_CONFIG: BudgetConfig = {
  totalBudget: 1500,
  endDate: '2026-06-30',
  fixedBudget: false,
};

const START_DATE = new Date(2026, 4, 2); // 2 de maio

export default function Home() {
  const [config, setConfig] = useState<BudgetConfig>(() => {
    const saved = localStorage.getItem('budgetConfig');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  const [expenses, setExpenses] = useState<DailyExpense[]>(() => {
    const saved = localStorage.getItem('expenses');
    return saved ? JSON.parse(saved) : [];
  });

  const [incomeEntries, setIncomeEntries] = useState<IncomeEntry[]>(() => {
    const saved = localStorage.getItem('incomeEntries');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentInput, setCurrentInput] = useState('');
  const [currentDescription, setCurrentDescription] = useState('');
  const [incomeInput, setIncomeInput] = useState('');
  const [incomeDate, setIncomeDate] = useState('');
  const [incomeDescription, setIncomeDescription] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [editBudget, setEditBudget] = useState(config.totalBudget.toString());
  const [editEndDate, setEditEndDate] = useState(config.endDate);
  const [editFixedBudget, setEditFixedBudget] = useState(config.fixedBudget);

  // Salvar dados no localStorage
  useEffect(() => {
    localStorage.setItem('budgetConfig', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('incomeEntries', JSON.stringify(incomeEntries));
  }, [incomeEntries]);

  // Calcular saldo total (orçamento + renda - gastos)
  const calculateBalance = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(config.endDate);
    if (today > endDate) {
      return 0; // Período expirado
    }

    // Total de renda recebida até hoje
    const totalIncome = incomeEntries.reduce((sum, entry) => {
      const entryDate = new Date(entry.date);
      if (entryDate <= today) {
        return sum + entry.amount;
      }
      return sum;
    }, 0);

    // Se orçamento está travado, ignora renda
    const availableBudget = config.fixedBudget ? config.totalBudget : config.totalBudget + totalIncome;

    // Total gasto até hoje
    const totalSpent = expenses.reduce((sum, exp) => {
      const expDate = new Date(exp.date);
      if (expDate <= today) {
        return sum + exp.amount;
      }
      return sum;
    }, 0);

    return Math.max(0, availableBudget - totalSpent);
  };

  // Calcular orçamento diário baseado no período
  const calculateDailyBudget = () => {
    const endDate = new Date(config.endDate);
    const daysTotal = Math.floor((endDate.getTime() - START_DATE.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return config.totalBudget / daysTotal;
  };

  // Obter gastos de hoje
  const getTodayExpenses = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expenses.filter(exp => {
      const expDate = new Date(exp.date);
      expDate.setHours(0, 0, 0, 0);
      return expDate.getTime() === today.getTime();
    });
  };

  // Calcular total gasto hoje
  const getTodayTotal = () => {
    return getTodayExpenses().reduce((sum, exp) => sum + exp.amount, 0);
  };

  // Adicionar gasto
  const handleAddExpense = () => {
    const amount = parseFloat(currentInput);

    if (!currentInput || isNaN(amount) || amount <= 0) {
      toast.error('Digite um valor válido');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const newExpense: DailyExpense = {
      date: today,
      amount,
      description: currentDescription || 'Gasto',
    };

    setExpenses([...expenses, newExpense]);
    setCurrentInput('');
    setCurrentDescription('');
    toast.success(`R$ ${amount.toFixed(2)} registrado!`);
  };

  // Deletar gasto
  const handleDeleteExpense = (index: number) => {
    const expense = expenses[index];
    setExpenses(expenses.filter((_, i) => i !== index));
    toast.success(`R$ ${expense.amount.toFixed(2)} removido`);
  };

  // Adicionar entrada de renda
  const handleAddIncome = () => {
    const amount = parseFloat(incomeInput);

    if (!incomeInput || isNaN(amount) || amount <= 0) {
      toast.error('Digite um valor válido');
      return;
    }

    if (!incomeDate) {
      toast.error('Selecione uma data');
      return;
    }

    const newIncome: IncomeEntry = {
      date: incomeDate,
      amount,
      description: incomeDescription || 'Renda',
    };

    setIncomeEntries([...incomeEntries, newIncome]);
    setIncomeInput('');
    setIncomeDate('');
    setIncomeDescription('');
    toast.success(`R$ ${amount.toFixed(2)} adicionado como renda!`);
  };

  // Deletar entrada de renda
  const handleDeleteIncome = (index: number) => {
    const income = incomeEntries[index];
    setIncomeEntries(incomeEntries.filter((_, i) => i !== index));
    toast.success(`Renda de R$ ${income.amount.toFixed(2)} removida`);
  };

  // Salvar configurações
  const handleSaveSettings = () => {
    const newBudget = parseFloat(editBudget);
    if (isNaN(newBudget) || newBudget <= 0) {
      toast.error('Orçamento inválido');
      return;
    }

    const newEndDate = new Date(editEndDate);
    const today = new Date();
    if (newEndDate < today) {
      toast.error('Data final deve ser no futuro');
      return;
    }

    setConfig({
      totalBudget: newBudget,
      endDate: editEndDate,
      fixedBudget: editFixedBudget,
    });

    setShowSettings(false);
    toast.success('Configurações salvas!');
  };

  const balance = calculateBalance();
  const dailyBudget = calculateDailyBudget();
  const todayExpenses = getTodayExpenses();
  const todayTotal = getTodayTotal();
  const percentageUsed = (todayTotal / dailyBudget) * 100;
  const daysRemaining = Math.ceil((new Date(config.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const totalIncome = incomeEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-gray-100">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container py-6 flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Meu Controle de Gastos
            </h1>
            <p className="text-gray-600 text-sm mt-1">
              Período: até {new Date(config.endDate).toLocaleDateString('pt-BR')} • {daysRemaining} dias restantes
            </p>
          </div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Settings className="w-6 h-6 text-gray-600" />
          </button>
        </div>
      </header>

      <main className="container py-8">
        {/* Settings Modal */}
        {showSettings && (
          <Card className="border-gray-200 mb-8 bg-blue-50">
            <div className="p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Configurações
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Orçamento Total (R$)
                  </label>
                  <Input
                    type="number"
                    value={editBudget}
                    onChange={(e) => setEditBudget(e.target.value)}
                    step="0.01"
                    min="0"
                    className="text-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data Final
                  </label>
                  <Input
                    type="date"
                    value={editEndDate}
                    onChange={(e) => setEditEndDate(e.target.value)}
                    className="text-lg"
                  />
                </div>
                <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200">
                  <input
                    type="checkbox"
                    id="fixedBudget"
                    checked={editFixedBudget}
                    onChange={(e) => setEditFixedBudget(e.target.checked)}
                    className="w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="fixedBudget" className="cursor-pointer flex-1">
                    <p className="font-medium text-gray-900">Orçamento Fixo (Travado)</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Quando ativado, o saldo máximo fica em R$ {editBudget}, ignorando entradas de renda
                    </p>
                  </label>
                </div>
                <div className="flex gap-4">
                  <Button
                    onClick={handleSaveSettings}
                    className="bg-green-600 hover:bg-green-700 text-white font-medium"
                  >
                    Salvar
                  </Button>
                  <Button
                    onClick={() => setShowSettings(false)}
                    variant="outline"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Saldo Principal */}
        <div className="mb-12">
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg">
            <div className="p-8">
              <p className="text-gray-600 text-sm font-medium uppercase tracking-wide mb-2">
                Saldo Disponível
              </p>
              <div className="text-6xl font-bold text-green-700 mb-4" style={{ fontFamily: "'Poppins', sans-serif" }}>
                R$ {balance.toFixed(2)}
              </div>
              <div className="flex justify-between items-center text-sm text-gray-600">
                <span>Orçamento: R$ {config.totalBudget.toFixed(2)}</span>
                {!config.fixedBudget && <span>Renda: R$ {totalIncome.toFixed(2)}</span>}
                {config.fixedBudget && <span className="text-amber-600 font-medium">🔒 Orçamento Fixo</span>}
                <span>Gasto: R$ {totalSpent.toFixed(2)}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Grid de Informações */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Orçamento de Hoje */}
          <Card className="border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-600 text-sm font-medium">Orçamento Hoje</p>
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                R$ {dailyBudget.toFixed(2)}
              </p>
              <div className="mt-4 bg-gray-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-green-600 h-full transition-all duration-300"
                  style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {percentageUsed.toFixed(0)}% utilizado
              </p>
            </div>
          </Card>

          {/* Gasto Hoje */}
          <Card className="border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-600 text-sm font-medium">Gasto Hoje</p>
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                R$ {todayTotal.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-4">
                {todayExpenses.length} transação{todayExpenses.length !== 1 ? 's' : ''}
              </p>
            </div>
          </Card>

          {/* Restante Hoje */}
          <Card className="border-gray-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-600 text-sm font-medium">Restante Hoje</p>
                <Plus className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                R$ {(dailyBudget - todayTotal).toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-4">
                {dailyBudget - todayTotal > 0 ? 'Você pode gastar mais' : 'Orçamento excedido'}
              </p>
            </div>
          </Card>
        </div>

        {/* Seção de Renda */}
        <Card className="border-gray-200 mb-12">
          <div className="p-8">
            <div className="flex items-center gap-2 mb-6">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h2 className="text-lg font-bold text-gray-900" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Registrar Renda
              </h2>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="date"
                  value={incomeDate}
                  onChange={(e) => setIncomeDate(e.target.value)}
                  className="text-lg"
                />
              </div>
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Valor (R$)"
                  value={incomeInput}
                  onChange={(e) => setIncomeInput(e.target.value)}
                  step="0.01"
                  min="0"
                  className="text-lg"
                />
              </div>
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Descrição (ex: Salário)"
                  value={incomeDescription}
                  onChange={(e) => setIncomeDescription(e.target.value)}
                  className="text-lg"
                />
              </div>
              <Button
                onClick={handleAddIncome}
                className="bg-green-600 hover:bg-green-700 text-white font-medium"
              >
                Adicionar
              </Button>
            </div>

            {/* Lista de Rendas */}
            {incomeEntries.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-4">Entradas de Renda</p>
                <div className="space-y-2">
                  {incomeEntries.map((income, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-green-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{income.description}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(income.date).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-green-700">
                          R$ {income.amount.toFixed(2)}
                        </p>
                        <button
                          onClick={() => handleDeleteIncome(index)}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Formulário de Entrada de Gastos */}
        <Card className="border-gray-200 mb-12">
          <div className="p-8">
            <h2 className="text-lg font-bold text-gray-900 mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Registrar Gasto
            </h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  type="number"
                  placeholder="Valor (R$)"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddExpense()}
                  step="0.01"
                  min="0"
                  className="text-lg"
                />
              </div>
              <div className="flex-1">
                <Input
                  type="text"
                  placeholder="Descrição (opcional)"
                  value={currentDescription}
                  onChange={(e) => setCurrentDescription(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddExpense()}
                  className="text-lg"
                />
              </div>
              <Button
                onClick={handleAddExpense}
                className="bg-green-600 hover:bg-green-700 text-white font-medium"
              >
                Adicionar
              </Button>
            </div>
          </div>
        </Card>

        {/* Histórico de Gastos */}
        {todayExpenses.length > 0 && (
          <Card className="border-gray-200">
            <div className="p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
                Gastos de Hoje
              </h2>
              <div className="space-y-3">
                {todayExpenses.map((expense, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {expense.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(expense.date).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-bold text-gray-900 text-lg" style={{ fontFamily: "'Poppins', sans-serif" }}>
                        R$ {expense.amount.toFixed(2)}
                      </p>
                      <button
                        onClick={() => handleDeleteExpense(index)}
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {todayExpenses.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              Nenhum gasto registrado hoje
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Comece adicionando seu primeiro gasto acima
            </p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white/50 mt-16 py-6">
        <div className="container text-center text-sm text-gray-600">
          <p>
            Seu orçamento diário é de <span className="font-bold" style={{ fontFamily: "'Poppins', sans-serif" }}>R$ {dailyBudget.toFixed(2)}</span>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Saldo não gasto acumula para os próximos dias
          </p>
        </div>
      </footer>
    </div>
  );
}
