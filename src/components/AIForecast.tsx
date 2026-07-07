import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle2, 
  Brain, 
  ArrowUpRight, 
  Pizza, 
  ChefHat, 
  Sliders, 
  Calendar,
  HelpCircle,
  Lightbulb,
  Clock,
  ChevronRight
} from 'lucide-react';
import { orderService, UnifiedOrder } from '../lib/orderService';
import { Pizza as PizzaType, PizzaBase as BaseType, PizzaTopping as ToppingType } from '../types';

interface ForecastItem {
  name: string;
  current_sales: number;
  forecasted_demand: number;
  confidence: 'High' | 'Medium' | 'Low';
  reasoning: string;
}

interface ForecastResponse {
  forecastedPizzas: {
    pizza_name: string;
    current_sales: number;
    forecasted_demand: number;
    confidence: 'High' | 'Medium' | 'Low';
    reasoning: string;
  }[];
  forecastedBases: {
    base_name: string;
    current_sales: number;
    forecasted_demand: number;
    confidence: 'High' | 'Medium' | 'Low';
    reasoning: string;
  }[];
  forecastedToppings: {
    topping_name: string;
    current_sales: number;
    forecasted_demand: number;
    confidence: 'High' | 'Medium' | 'Low';
    reasoning: string;
  }[];
  insights: string[];
  recommendations: string[];
  isSimulated: boolean;
  message?: string;
}

interface AIForecastProps {
  pizzas: PizzaType[];
  bases: BaseType[];
  toppings: ToppingType[];
}

export const AIForecast: React.FC<AIForecastProps> = ({ pizzas, bases, toppings }) => {
  const [orders, setOrders] = useState<UnifiedOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'pizzas' | 'bases' | 'toppings'>('pizzas');
  const [loadingStep, setLoadingStep] = useState(0);

  const loadingSteps = [
    "Compiling past order history logs...",
    "Analyzing weekly inventory velocity trends...",
    "Connecting to Gemini-3.5-Flash forecasting node...",
    "Running predictive regression demand matrix...",
    "Structuring qualitative stock recommendations..."
  ];

  // Rotate loading steps for better UX
  useEffect(() => {
    let interval: any;
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
      }, 1500);
    } else {
      setLoadingStep(0);
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    // Fetch order history on load
    const fetchHistory = async () => {
      try {
        const fetched = await orderService.fetchOrders();
        if (fetched && fetched.length > 0) {
          setOrders(fetched);
        } else {
          const stored = localStorage.getItem('pizza_orders');
          if (stored) {
            setOrders(JSON.parse(stored));
          }
        }
      } catch (e) {
        console.error("Failed to load order history for AI forecasting", e);
      }
    };
    fetchHistory();
  }, []);

  const handleGenerateForecast = async () => {
    setLoading(true);
    setError(null);
    setForecast(null);
    try {
      const apiBaseUrl = (import.meta as any).env?.VITE_API_URL || '';
      const response = await fetch(`${apiBaseUrl}/api/forecast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orders,
          pizzas,
          bases,
          toppings
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned error status ${response.status}`);
      }

      const data = await response.json();
      setForecast(data);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "An unexpected error occurred while compiling AI demand forecast.");
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceBadgeColor = (conf: 'High' | 'Medium' | 'Low') => {
    switch (conf) {
      case 'High':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'Low':
        return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };

  return (
    <div className="space-y-6">
      {/* Forecasting Control and Setup Header */}
      <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-tomato/10 text-tomato rounded-lg">
              <Brain size={16} />
            </span>
            <h3 className="text-lg font-extrabold text-slate-900 font-display flex items-center gap-1.5">
              AI Demand Forecasting Engine
            </h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            Harness predictive neural insights to anticipate core pizza recipes, crust bases, and topping items required for next week's inventory supply based on your historic sales data.
          </p>
        </div>

        <button
          onClick={handleGenerateForecast}
          disabled={loading || orders.length === 0}
          className="self-start md:self-auto flex items-center gap-2 bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-xs py-3 px-6 rounded-xl shadow-md cursor-pointer transition disabled:opacity-50"
        >
          <Sparkles size={14} className={loading ? "animate-spin text-tomato" : "text-amber-400"} />
          {loading ? "Generating Forecast..." : "Generate AI Forecast"}
        </button>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="bg-slate-50 border border-slate-200 rounded-[28px] py-16 px-6 text-center space-y-4 flex flex-col items-center justify-center">
          <div className="relative">
            <div className="w-12 h-12 border-4 border-tomato/20 border-t-tomato rounded-full animate-spin" />
            <Sparkles size={18} className="absolute inset-0 m-auto text-amber-400 animate-pulse" />
          </div>
          <div className="space-y-1.5">
            <p className="text-xs font-bold text-slate-800 font-mono">
              {loadingSteps[loadingStep]}
            </p>
            <p className="text-[10px] text-slate-400">
              This process may take up to 10 seconds. Please do not close this screen.
            </p>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="p-5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3.5 text-xs text-rose-800 font-medium">
          <AlertCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-extrabold">Forecast Compilation Failed</p>
            <p className="text-rose-600/80 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {/* Forecast Visualizer Dashboard */}
      {!loading && forecast && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Active Model Status Indicator */}
          <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
            forecast.isSimulated 
              ? 'bg-amber-50 border-amber-200/80 text-amber-800' 
              : 'bg-emerald-50 border-emerald-200/80 text-emerald-800'
          }`}>
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className={forecast.isSimulated ? "text-amber-600 mt-0.5 shrink-0" : "text-emerald-600 mt-0.5 shrink-0"} />
              <div className="space-y-0.5">
                <span className="font-extrabold block">
                  {forecast.isSimulated 
                    ? "Store Statistical Analytics Active" 
                    : "Advanced Gemini-3.5-Flash Neural Model Loaded"}
                </span>
                <span className="opacity-80 block text-[10px]">
                  {forecast.isSimulated 
                    ? "Statistical forecasting averages are derived locally." 
                    : "Predictive demand intelligence has been processed successfully through server-side GenAI."}
                </span>
              </div>
            </div>
            {forecast.message && (
              <span className="text-[10px] font-mono font-bold bg-white/60 border px-2.5 py-1 rounded-lg self-start sm:self-auto text-slate-600">
                {forecast.message}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left/Middle Columns: Predictions Visualization */}
            <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 font-display">Predicted Supply Quantities</h4>
                  <p className="text-[10px] text-slate-400">Comparison of past orders sales vs predicted demand volume</p>
                </div>

                {/* Category selectors */}
                <div className="bg-slate-50 border border-slate-200 p-0.5 rounded-xl flex shadow-2xs font-mono text-[10px] font-bold">
                  {[
                    { id: 'pizzas', label: 'Pizzas', icon: Pizza },
                    { id: 'bases', label: 'Bases', icon: ChefHat },
                    { id: 'toppings', label: 'Toppings', icon: Sliders }
                  ].map((cat) => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id as any)}
                        className={`py-1.5 px-3 rounded-lg flex items-center gap-1 transition ${
                          activeCategory === cat.id 
                            ? 'bg-slate-950 text-white shadow-xs' 
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        <Icon size={12} />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Graphical Bar Lists */}
              <div className="space-y-5">
                {activeCategory === 'pizzas' && forecast.forecastedPizzas.map((item, idx) => (
                  <div key={idx} className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-800">{item.pizza_name}</span>
                      <div className="font-mono font-bold flex items-center gap-2">
                        <span className="text-slate-400">Sold: {item.current_sales}</span>
                        <ChevronRight size={12} className="text-slate-300" />
                        <span className="text-tomato bg-tomato/5 px-2 py-0.5 rounded font-black flex items-center gap-0.5">
                          Demand: {item.forecasted_demand}
                          <ArrowUpRight size={10} />
                        </span>
                      </div>
                    </div>

                    {/* Comparative Dual bar */}
                    <div className="h-2 bg-slate-200/70 rounded-full overflow-hidden relative flex">
                      <div 
                        className="bg-slate-400 h-full rounded-l-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, (item.current_sales / Math.max(1, item.forecasted_demand)) * 100)}%` }}
                      />
                      <div 
                        className="bg-tomato h-full rounded-r-full transition-all duration-500" 
                        style={{ width: `${Math.max(0, 100 - (item.current_sales / Math.max(1, item.forecasted_demand)) * 100)}%` }}
                      />
                    </div>

                    {/* Reasoning and Confidence */}
                    <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-2 pt-1">
                      <p className="text-[10px] text-slate-500 leading-normal flex-1">
                        <span className="font-bold text-slate-600 font-mono">Reasoning: </span>
                        {item.reasoning}
                      </p>
                      <span className={`px-2 py-0.5 rounded border text-[9px] font-bold font-mono ${getConfidenceBadgeColor(item.confidence)}`}>
                        {item.confidence} Confidence
                      </span>
                    </div>
                  </div>
                ))}

                {activeCategory === 'bases' && forecast.forecastedBases.map((item, idx) => (
                  <div key={idx} className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-800">{item.base_name}</span>
                      <div className="font-mono font-bold flex items-center gap-2">
                        <span className="text-slate-400">Sold: {item.current_sales}</span>
                        <ChevronRight size={12} className="text-slate-300" />
                        <span className="text-tomato bg-tomato/5 px-2 py-0.5 rounded font-black flex items-center gap-0.5">
                          Demand: {item.forecasted_demand}
                          <ArrowUpRight size={10} />
                        </span>
                      </div>
                    </div>

                    {/* Comparative Dual bar */}
                    <div className="h-2 bg-slate-200/70 rounded-full overflow-hidden relative flex">
                      <div 
                        className="bg-slate-400 h-full rounded-l-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, (item.current_sales / Math.max(1, item.forecasted_demand)) * 100)}%` }}
                      />
                      <div 
                        className="bg-tomato h-full rounded-r-full transition-all duration-500" 
                        style={{ width: `${Math.max(0, 100 - (item.current_sales / Math.max(1, item.forecasted_demand)) * 100)}%` }}
                      />
                    </div>

                    {/* Reasoning and Confidence */}
                    <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-2 pt-1">
                      <p className="text-[10px] text-slate-500 leading-normal flex-1">
                        <span className="font-bold text-slate-600 font-mono">Reasoning: </span>
                        {item.reasoning}
                      </p>
                      <span className={`px-2 py-0.5 rounded border text-[9px] font-bold font-mono ${getConfidenceBadgeColor(item.confidence)}`}>
                        {item.confidence} Confidence
                      </span>
                    </div>
                  </div>
                ))}

                {activeCategory === 'toppings' && forecast.forecastedToppings.map((item, idx) => (
                  <div key={idx} className="space-y-1.5 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-extrabold text-slate-800">{item.topping_name}</span>
                      <div className="font-mono font-bold flex items-center gap-2">
                        <span className="text-slate-400">Sold: {item.current_sales}</span>
                        <ChevronRight size={12} className="text-slate-300" />
                        <span className="text-tomato bg-tomato/5 px-2 py-0.5 rounded font-black flex items-center gap-0.5">
                          Demand: {item.forecasted_demand}
                          <ArrowUpRight size={10} />
                        </span>
                      </div>
                    </div>

                    {/* Comparative Dual bar */}
                    <div className="h-2 bg-slate-200/70 rounded-full overflow-hidden relative flex">
                      <div 
                        className="bg-slate-400 h-full rounded-l-full transition-all duration-500" 
                        style={{ width: `${Math.min(100, (item.current_sales / Math.max(1, item.forecasted_demand)) * 100)}%` }}
                      />
                      <div 
                        className="bg-tomato h-full rounded-r-full transition-all duration-500" 
                        style={{ width: `${Math.max(0, 100 - (item.current_sales / Math.max(1, item.forecasted_demand)) * 100)}%` }}
                      />
                    </div>

                    {/* Reasoning and Confidence */}
                    <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-2 pt-1">
                      <p className="text-[10px] text-slate-500 leading-normal flex-1">
                        <span className="font-bold text-slate-600 font-mono">Reasoning: </span>
                        {item.reasoning}
                      </p>
                      <span className={`px-2 py-0.5 rounded border text-[9px] font-bold font-mono ${getConfidenceBadgeColor(item.confidence)}`}>
                        {item.confidence} Confidence
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Column: General AI Insights & Action Items */}
            <div className="space-y-6">
              
              {/* Store Demand Insights */}
              <div className="bg-white border border-slate-200 rounded-[28px] p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
                    <Lightbulb size={15} />
                  </span>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-500">
                    Demand Insights
                  </h4>
                </div>
                <div className="space-y-3">
                  {forecast.insights.map((insight, idx) => (
                    <div key={idx} className="bg-slate-50/75 border border-slate-100 p-3 rounded-xl text-xs text-slate-600 leading-relaxed font-sans">
                      {insight}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actionable Recommendations */}
              <div className="bg-slate-950 border border-slate-900 rounded-[28px] p-6 text-white space-y-4 shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-tomato/20 text-tomato rounded-lg">
                    <TrendingUp size={15} />
                  </span>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-tomato">
                    Action Recommendations
                  </h4>
                </div>
                <div className="space-y-3">
                  {forecast.recommendations.map((rec, idx) => (
                    <div key={idx} className="flex gap-2 text-xs text-slate-300 leading-relaxed font-sans">
                      <span className="text-tomato font-bold mt-0.5 font-mono">#{idx+1}</span>
                      <span>{rec}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>
        </motion.div>
      )}

      {/* Seeding state helper card */}
      {!forecast && !loading && (
        <div className="py-16 text-center border border-dashed border-slate-200 rounded-[28px] bg-slate-50/40 space-y-3.5">
          <Calendar size={28} className="text-slate-300 mx-auto" />
          <div className="space-y-1">
            <p className="text-xs font-extrabold text-slate-700">Forecast Matrix Ready</p>
            <p className="text-[10px] text-slate-400 max-w-sm mx-auto">
              Ready to process {orders.length} past orders against current {pizzas.length} pizzas, {bases.length} bases, and {toppings.length} toppings definitions.
            </p>
          </div>
          <button
            onClick={handleGenerateForecast}
            className="py-2 px-5 bg-tomato hover:bg-tomato-hover text-white text-xs font-bold rounded-xl shadow-sm transition inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles size={13} className="text-amber-300" />
            Analyze past history
          </button>
        </div>
      )}
    </div>
  );
};
