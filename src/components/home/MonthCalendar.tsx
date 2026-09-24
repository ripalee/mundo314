import React, { useState } from 'react';
import { useLeague } from '../../context/LeagueContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const MonthCalendar: React.FC = () => {
  const { selectedDate, setSelectedDate } = useLeague();

  const initialDate = selectedDate ? new Date(selectedDate + 'T12:00:00') : new Date();
  const [currentMonth, setCurrentMonth] = useState<number>(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState<number>(initialDate.getFullYear());

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const monthNames = [
    'ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO',
    'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'
  ];

  const weekDays = ['LU', 'MA', 'MI', 'JU', 'VI', 'SA', 'DO'];

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
  const startingDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDate(todayStr);
  };

  const handleSelectDay = (day: number) => {
    const formattedMonth = String(currentMonth + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;
    setSelectedDate(dateStr);
  };

  return (
    <div className="bg-[#102d1e] border border-[#1d4c33] rounded-sm p-2 mb-3 select-none text-xs shadow-sm">
      <div className="flex items-center justify-between pb-1.5 border-b border-[#1d4c33]">
        <div className="flex items-center space-x-2">
          <span className="font-bold text-white tracking-wider">
            {monthNames[currentMonth]} {currentYear}
          </span>
          {selectedDate !== todayStr && (
            <button
              onClick={goToToday}
              className="text-[10px] text-[#22c55e] hover:underline font-bold"
            >
              Ir a Hoy
            </button>
          )}
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={prevMonth}
            className="p-1 text-[#8eb89c] hover:text-white rounded-xs hover:bg-[#18442b]"
            title="Mes anterior"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1 text-[#8eb89c] hover:text-white rounded-xs hover:bg-[#18442b]"
            title="Mes siguiente"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 pt-1.5 pb-1 text-center font-bold text-[10px] text-[#78a587]">
        {weekDays.map(d => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {Array.from({ length: startingDay }).map((_, i) => (
          <div key={`empty-${i}`} className="h-6" />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const formattedMonth = String(currentMonth + 1).padStart(2, '0');
          const formattedDay = String(day).padStart(2, '0');
          const dateStr = `${currentYear}-${formattedMonth}-${formattedDay}`;

          const isSelected = selectedDate === dateStr;
          const isToday = todayStr === dateStr;

          return (
            <button
              key={day}
              onClick={() => handleSelectDay(day)}
              className={`h-6 rounded-xs text-center flex items-center justify-center font-medium transition-colors ${
                isSelected
                  ? 'bg-[#22c55e] text-black font-black'
                  : isToday
                  ? 'border border-[#22c55e] text-white font-bold'
                  : 'text-[#e2f0e6] hover:bg-[#18442b] hover:text-white'
              }`}
            >
              {day}
            </button>
          );
        })}
      </div>
    </div>
  );
};
