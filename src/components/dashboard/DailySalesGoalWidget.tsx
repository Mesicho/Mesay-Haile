import React, { useState, useEffect } from 'react';
import { Target, Trophy, Flame, Edit2, Check, X, Sparkles, TrendingUp, AlertCircle } from 'lucide-react';

interface DailySalesGoalWidgetProps {
  todaySalesTotal: number;
  language: 'am' | 'en';
}

const STORAGE_KEY_GOAL = 'ethio_daily_sales_goal';

export const DailySalesGoalWidget: React.FC<DailySalesGoalWidgetProps> = ({
  todaySalesTotal,
  language,
}) => {
  const isAmharic = language === 'am';

  // Load saved goal or default to 25,000 ETB
  const [goalAmount, setGoalAmount] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_GOAL);
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return 25000;
  });

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [inputVal, setInputVal] = useState<string>(goalAmount.toString());
  const [inputError, setInputError] = useState<string | null>(null);

  useEffect(() => {
    setInputVal(goalAmount.toString());
  }, [goalAmount]);

  const handleSaveGoal = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const val = parseFloat(inputVal.replace(/,/g, '').trim());
    if (isNaN(val) || val <= 0) {
      setInputError(isAmharic ? 'እባክዎ ትክክለኛ የብር መጠን ያስገቡ' : 'Please enter a valid positive number');
      return;
    }
    setGoalAmount(val);
    try {
      localStorage.setItem(STORAGE_KEY_GOAL, val.toString());
    } catch (err) {
      console.warn('Could not persist sales goal', err);
    }
    setInputError(null);
    setIsEditing(false);
  };

  const handlePresetSelect = (preset: number) => {
    setInputVal(preset.toString());
    setGoalAmount(preset);
    try {
      localStorage.setItem(STORAGE_KEY_GOAL, preset.toString());
    } catch {
      // ignore
    }
    setIsEditing(false);
  };

  // Calculations
  const percentage = goalAmount > 0 ? (todaySalesTotal / goalAmount) * 100 : 0;
  const roundedPercentage = Math.round(percentage);
  const cappedProgress = Math.min(percentage, 100);
  const remaining = Math.max(0, goalAmount - todaySalesTotal);
  const isAchieved = todaySalesTotal >= goalAmount;

  // Status message
  const getMotivationalMessage = () => {
    if (isAchieved) {
      return {
        textAm: '🎉 ድንቅ ስራ! የዛሬው የሽያጭ ግብ ሙሉ በሙሉ ተሳክቷል!',
        textEn: "🎉 Fantastic job! Today's sales target is fully achieved!",
        color: 'text-emerald-500 dark:text-emerald-400',
      };
    }
    if (percentage >= 75) {
      return {
        textAm: '🔥 በጣም ተቃርቧል! ግቡን ለማሳካት ጥቂት ሽያጭ ብቻ ይቀራል',
        textEn: "🔥 Almost there! Just a few more sales to hit the goal",
        color: 'text-amber-500 dark:text-amber-400',
      };
    }
    if (percentage >= 50) {
      return {
        textAm: '💪 ግማሹ ተጠናቋል! ይህንኑ ፍጥነት አስቀጥሉ',
        textEn: '💪 Halfway mark passed! Keep up the momentum',
        color: 'text-blue-500 dark:text-blue-400',
      };
    }
    return {
      textAm: '🚀 ቀኑ ገና ነው! የዛሬውን ሽያጭ በንቃት ያስፋፉ',
      textEn: '🚀 Day in progress! Work towards reaching your daily revenue',
      color: 'text-slate-500 dark:text-slate-400',
    };
  };

  const msg = getMotivationalMessage();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all duration-200">
      {/* Background celebration glow if achieved */}
      {isAchieved && (
        <div className="absolute -right-16 -top-16 w-48 h-48 bg-gradient-to-br from-amber-500/10 via-emerald-500/15 to-transparent rounded-full blur-2xl pointer-events-none" />
      )}

      {/* Header Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shadow-sm ${
            isAchieved
              ? 'bg-gradient-to-tr from-amber-500 to-emerald-500 text-white shadow-emerald-500/20'
              : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
          }`}>
            {isAchieved ? <Trophy className="w-5 h-5 animate-bounce" /> : <Target className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                {isAmharic ? 'የዕለቱ ሽያጭ ግብ' : 'Daily Sales Goal'}
              </h3>
              {isAchieved && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <Sparkles className="w-3 h-3" />
                  {isAmharic ? 'ተሳክቷል' : 'Goal Met'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isAmharic
                ? 'የዛሬ የታለመ ገቢ እና የእድገት መከታተያ'
                : 'Target revenue & real-time progress tracker'}
            </p>
          </div>
        </div>

        {/* Goal edit trigger button */}
        {!isEditing ? (
          <button
            onClick={() => {
              setIsEditing(true);
              setInputVal(goalAmount.toString());
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold transition active:scale-95 border border-slate-200 dark:border-slate-700 cursor-pointer"
          >
            <Edit2 className="w-3.5 h-3.5 text-slate-500" />
            <span>{isAmharic ? 'ግብ አሻሽል' : 'Set Target'}</span>
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsEditing(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Editing Form when active */}
      {isEditing && (
        <form onSubmit={handleSaveGoal} className="mb-4 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-blue-500/30 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">ETB</span>
              <input
                type="number"
                min="100"
                step="500"
                value={inputVal}
                onChange={(e) => {
                  setInputVal(e.target.value);
                  setInputError(null);
                }}
                placeholder="25,000"
                className="w-full pl-12 pr-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isAmharic ? 'አስቀምጥ' : 'Save'}</span>
            </button>
          </div>

          {inputError && (
            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {inputError}
            </p>
          )}

          {/* Quick preset buttons */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mr-1">
              {isAmharic ? 'ፈጣን ምርጫዎች፡' : 'Quick Presets:'}
            </span>
            {[10000, 25000, 50000, 100000].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border transition ${
                  goalAmount === preset
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:border-blue-400'
                }`}
              >
                {preset.toLocaleString()} ETB
              </button>
            ))}
          </div>
        </form>
      )}

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3.5">
        {/* Achieved Today */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
            {isAmharic ? '💰 የዛሬ ሽያጭ' : 'Current Sales'}
          </span>
          <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-0.5 font-mono">
            {todaySalesTotal.toLocaleString()}{' '}
            <span className="text-xs font-normal text-amber-500">ETB</span>
          </p>
        </div>

        {/* Daily Target */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
            {isAmharic ? '🎯 የታለመው ግብ' : 'Daily Target'}
          </span>
          <p className="text-base sm:text-lg font-black text-blue-600 dark:text-blue-400 mt-0.5 font-mono">
            {goalAmount.toLocaleString()}{' '}
            <span className="text-xs font-normal text-slate-400">ETB</span>
          </p>
        </div>

        {/* Remaining to Reach */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
            {isAmharic ? '⏳ የቀረው መጠን' : 'Remaining'}
          </span>
          <p className={`text-base sm:text-lg font-black mt-0.5 font-mono ${
            isAchieved ? 'text-emerald-500' : 'text-slate-700 dark:text-slate-200'
          }`}>
            {isAchieved ? (
              <span className="text-emerald-500 text-sm font-bold flex items-center gap-1">
                <Check className="w-4 h-4" /> 0 ETB
              </span>
            ) : (
              `${remaining.toLocaleString()} ETB`
            )}
          </p>
        </div>

        {/* Completion % */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
            {isAmharic ? '📊 የተሳካው መቶኛ' : 'Goal Completion'}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <p className={`text-base sm:text-lg font-black font-mono ${
              isAchieved
                ? 'text-emerald-500 dark:text-emerald-400'
                : percentage >= 50
                ? 'text-blue-600 dark:text-blue-400'
                : 'text-amber-500'
            }`}>
              {roundedPercentage}%
            </p>
            {isAchieved ? (
              <Flame className="w-4 h-4 text-amber-500" />
            ) : (
              <TrendingUp className="w-3.5 h-3.5 text-slate-400" />
            )}
          </div>
        </div>
      </div>

      {/* Visual Progress Bar Indicator */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-600 dark:text-slate-300">
            {isAmharic ? 'የሂደት ማሳያ (Progress)' : 'Goal Progress'}
          </span>
          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
            {todaySalesTotal.toLocaleString()} / {goalAmount.toLocaleString()} ETB ({roundedPercentage}%)
          </span>
        </div>

        {/* Multi-tier gradient progress track */}
        <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 p-0.5 overflow-hidden shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              isAchieved
                ? 'bg-gradient-to-r from-amber-400 via-emerald-400 to-emerald-500 shadow-md shadow-emerald-500/30'
                : percentage >= 75
                ? 'bg-gradient-to-r from-blue-500 via-teal-400 to-emerald-500'
                : percentage >= 50
                ? 'bg-gradient-to-r from-blue-600 to-indigo-500'
                : 'bg-gradient-to-r from-amber-500 to-blue-500'
            }`}
            style={{ width: `${cappedProgress}%` }}
          />
        </div>
      </div>

      {/* Motivational message footer */}
      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <p className={`font-medium ${msg.color}`}>
          {isAmharic ? msg.textAm : msg.textEn}
        </p>

        {isAchieved && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-bold text-amber-500 dark:text-amber-400">
            <Sparkles className="w-3.5 h-3.5" />
            +{((todaySalesTotal - goalAmount)).toLocaleString()} ETB {isAmharic ? 'ከተያዘው ግብ በላይ' : 'above target'}
          </span>
        )}
      </div>
    </div>
  );
};
