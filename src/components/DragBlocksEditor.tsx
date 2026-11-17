import { useState, type DragEvent } from 'react';
import { GripVertical, X } from 'lucide-react';
import type { CodeLineTemplate, DraggableBlock } from '../types/curriculum';

interface DragBlocksEditorProps {
  lines: CodeLineTemplate[];
  blocks: DraggableBlock[];
  slotAssignments: Record<string, string>; // slotId -> blockId
  onAssignSlot: (slotId: string, blockId: string) => void;
  onClearSlot: (slotId: string) => void;
}

const BLOCK_STYLES: Record<DraggableBlock['category'], string> = {
  keyword: 'bg-violet-50 border-violet-300 text-violet-900 hover:border-violet-400',
  function: 'bg-sky-50 border-sky-300 text-sky-900 hover:border-sky-400',
  value: 'bg-emerald-50 border-emerald-300 text-emerald-900 hover:border-emerald-400',
  operator: 'bg-amber-50 border-amber-300 text-amber-900 hover:border-amber-400',
  variable: 'bg-slate-100 border-slate-300 text-slate-900 hover:border-slate-400',
};

const PLACED_BLOCK_STYLES: Record<DraggableBlock['category'], string> = {
  keyword: 'bg-violet-500/20 border-violet-400 text-violet-200',
  function: 'bg-sky-500/20 border-sky-400 text-sky-200',
  value: 'bg-emerald-500/20 border-emerald-400 text-emerald-200',
  operator: 'bg-amber-500/20 border-amber-400 text-amber-200',
  variable: 'bg-slate-700 border-slate-400 text-slate-100',
};

export function DragBlocksEditor({
  lines,
  blocks,
  slotAssignments,
  onAssignSlot,
  onClearSlot,
}: DragBlocksEditorProps) {
  const [dragOverSlotId, setDragOverSlotId] = useState<string | null>(null);

  const usedBlockIds = new Set(Object.values(slotAssignments));
  const orderedSlotIds = lines.flatMap((line) =>
    line.segments.filter((seg) => seg.type === 'slot').map((seg) => seg.id)
  );

  const findBlock = (blockId: string | undefined) =>
    blocks.find((b) => b.id === blockId);

  const handleDragStart = (
    e: DragEvent<HTMLElement>,
    blockId: string,
    fromSlotId?: string
  ) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ blockId, fromSlotId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDropOnSlot = (e: DragEvent<HTMLDivElement>, targetSlotId: string) => {
    e.preventDefault();
    setDragOverSlotId(null);
    const raw = e.dataTransfer.getData('text/plain');
    if (!raw) return;
    try {
      const payload = JSON.parse(raw) as { blockId?: string; fromSlotId?: string };
      if (!payload.blockId) return;
      if (payload.fromSlotId && payload.fromSlotId !== targetSlotId) {
        onClearSlot(payload.fromSlotId);
      }
      onAssignSlot(targetSlotId, payload.blockId);
    } catch {
      // Ignore malformed drop payload
    }
  };

  const handleQuickPlaceBlock = (blockId: string) => {
    const nextEmptySlot = orderedSlotIds.find((slotId) => !slotAssignments[slotId]);
    if (nextEmptySlot) {
      onAssignSlot(nextEmptySlot, blockId);
    }
  };

  return (
    <div className="space-y-4">
      {/* Code Canvas */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="font-mono">main.py</span>
          <span>拖曳積木至下方虛線插槽（或點擊積木快速填入）</span>
        </div>

        <div className="p-4 sm:p-5 space-y-2.5 overflow-x-auto">
          {lines.map((line) => (
            <div
              key={line.lineNumber}
              className="flex items-center min-h-[40px] font-mono text-sm leading-relaxed whitespace-nowrap"
            >
              <span className="w-7 shrink-0 text-right pr-3 text-xs text-slate-500 select-none tabular-nums">
                {line.lineNumber}
              </span>

              {/* Indentation visual guide */}
              {line.indent > 0 && (
                <span
                  aria-hidden="true"
                  className="inline-flex items-center select-none"
                  style={{ width: `${line.indent * 2}rem` }}
                >
                  {Array.from({ length: line.indent }).map((_, idx) => (
                    <span
                      key={idx}
                      className="inline-block w-8 h-7 border-l border-slate-700/80 ml-1"
                    />
                  ))}
                </span>
              )}

              <div className="flex items-center flex-wrap gap-1.5">
                {line.segments.map((seg, idx) => {
                  if (seg.type === 'text') {
                    return (
                      <span key={idx} className="text-slate-100 whitespace-pre">
                        {seg.value}
                      </span>
                    );
                  }

                  if (seg.type === 'slot') {
                    const assignedBlock = findBlock(slotAssignments[seg.id]);
                    const isOver = dragOverSlotId === seg.id;

                    return (
                      <div
                        key={seg.id}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOverSlotId(seg.id);
                        }}
                        onDragLeave={() => setDragOverSlotId(null)}
                        onDrop={(e) => handleDropOnSlot(e, seg.id)}
                        style={{
                          minWidth: assignedBlock ? undefined : `${seg.minWidthCh ?? 10}ch`,
                        }}
                        className={`inline-flex items-center rounded-lg transition-all ${
                          assignedBlock
                            ? ''
                            : isOver
                              ? 'border-2 border-dashed border-sky-400 bg-sky-500/15 px-3 py-1.5'
                              : 'border border-dashed border-slate-600 bg-slate-800/70 px-3 py-1.5 hover:border-slate-500'
                        }`}
                      >
                        {assignedBlock ? (
                          <div
                            draggable
                            onDragStart={(e) => handleDragStart(e, assignedBlock.id, seg.id)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-sm font-mono cursor-grab active:cursor-grabbing ${
                              PLACED_BLOCK_STYLES[assignedBlock.category]
                            }`}
                          >
                            <span>{assignedBlock.code}</span>
                            <button
                              type="button"
                              onClick={() => onClearSlot(seg.id)}
                              aria-label={`移除 ${assignedBlock.code}`}
                              className="p-0.5 rounded hover:bg-white/15 text-current opacity-80 hover:opacity-100 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400 select-none">
                            {seg.placeholder}
                          </span>
                        )}
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Block Tray */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-slate-700">
            可用程式積木庫
          </h3>
          <span className="text-xs text-slate-500">
            可拖曳或點擊積木放入程式碼
          </span>
        </div>

        <div className="flex flex-wrap gap-2.5">
          {blocks.map((block) => {
            const isUsed = usedBlockIds.has(block.id);
            return (
              <button
                key={block.id}
                type="button"
                draggable={!isUsed}
                disabled={isUsed}
                onDragStart={(e) => handleDragStart(e, block.id)}
                onClick={() => !isUsed && handleQuickPlaceBlock(block.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border font-mono text-sm transition-all min-h-[40px] ${
                  isUsed
                    ? 'bg-slate-50 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed'
                    : `${BLOCK_STYLES[block.category]} cursor-grab active:cursor-grabbing shadow-2xs`
                }`}
              >
                <GripVertical className="w-3.5 h-3.5 opacity-60 shrink-0" />
                <span>{block.code}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
