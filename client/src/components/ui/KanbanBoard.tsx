import React from 'react';
import { Kanban, List, DollarSign, Calendar, User, Phone } from 'lucide-react';
import { formatINR, formatDateStr, formatMobileStr } from '../../utils/formatters';

export interface KanbanCardData {
  id: string;
  title: string;
  subtitle: string;
  value: number;
  dateLabel?: string;
  dateValue?: Date | string | null;
  mobile?: string | null;
  status: string;
  rawRecord: any;
}

interface KanbanBoardProps {
  columns: string[];
  cards: KanbanCardData[];
  onStatusChange: (id: string, newStatus: string) => void;
  onCardClick: (card: KanbanCardData) => void;
  viewMode: 'kanban' | 'table';
  onViewModeToggle: () => void;
  accentColor: string; // Tailwind color class e.g., 'brand-tech' or 'brand-re'
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  columns,
  cards,
  onStatusChange,
  onCardClick,
  viewMode,
  onViewModeToggle,
  accentColor
}) => {

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (id) {
      onStatusChange(id, targetStatus);
    }
  };

  // Helper to count and sum values per column status
  const getColumnStats = (status: string) => {
    const statusCards = cards.filter(c => c.status.toLowerCase() === status.toLowerCase());
    const count = statusCards.length;
    const total = statusCards.reduce((sum, c) => sum + c.value, 0);
    return { count, total };
  };

  if (viewMode === 'table') return null;

  return (
    <div className="w-full space-y-6">
      
      {/* Header controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest font-heading">
          Visual Kanban Pipeline
        </h3>
        <button
          onClick={onViewModeToggle}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-card hover:bg-slate-800 text-slate-300 hover:text-white border border-brand-border/60 transition-all duration-200"
        >
          <List className="w-4 h-4" />
          Switch to Table List
        </button>
      </div>

      {/* Grid columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colCards = cards.filter(c => c.status.toLowerCase() === col.toLowerCase());
          const { count, total } = getColumnStats(col);

          return (
            <div
              key={col}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, col)}
              className="flex flex-col min-w-[260px] rounded-xl bg-brand-card/40 border border-brand-border/40 p-4 transition-colors duration-200 hover:bg-brand-card/50"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-brand-border/30">
                <div>
                  <h4 className="text-sm font-bold text-slate-200 font-heading">
                    {col}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    {formatINR(total)} value
                  </p>
                </div>
                <span className="flex items-center justify-center w-5.5 h-5.5 text-xs font-extrabold rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                  {count}
                </span>
              </div>

              {/* Cards body */}
              <div className="flex-1 space-y-3 mt-4 min-h-[350px]">
                {colCards.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 border border-dashed border-brand-border/30 rounded-lg text-slate-600 text-xs">
                    Drag cards here
                  </div>
                ) : (
                  colCards.map((card) => (
                    <div
                      key={card.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, card.id)}
                      onClick={() => onCardClick(card)}
                      className="group p-4 rounded-xl bg-[#161623] border border-brand-border/50 hover:border-slate-500 cursor-pointer shadow-md transition-all duration-200 hover:-translate-y-0.5 active:scale-98"
                    >
                      {/* Card Title */}
                      <h5 className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors">
                        {card.title}
                      </h5>
                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-500" />
                        {card.subtitle}
                      </p>

                      {/* Card Value */}
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-brand-border/20">
                        <div className="flex items-center gap-0.5 text-xs font-bold text-slate-300">
                          <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                          <span>{formatINR(card.value)}</span>
                        </div>
                        {card.dateValue && (
                          <div className="flex items-center gap-1 text-[9px] text-slate-400">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            <span>{formatDateStr(card.dateValue)}</span>
                          </div>
                        )}
                      </div>

                      {/* Card Mobile & Interactive details */}
                      {card.mobile && (
                        <div className="text-[9px] text-slate-500 mt-2 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-600" />
                          <span>{formatMobileStr(card.mobile)}</span>
                        </div>
                      )}

                      {/* Quick click controls to change status on mobile */}
                      <div className="flex justify-end gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        {columns.map((st) => {
                          if (st.toLowerCase() === card.status.toLowerCase()) return null;
                          return (
                            <button
                              key={st}
                              title={`Move to ${st}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onStatusChange(card.id, st);
                              }}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60"
                            >
                              Move {st.split(' ')[0]}
                            </button>
                          );
                        })}
                      </div>

                    </div>
                  ))
                )}
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
