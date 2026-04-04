"use client";

import Link from "next/link";
import { DragDropContext, Draggable, Droppable, type DropResult } from "react-beautiful-dnd";
import { useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAthleteDetailQuery } from "@/hooks/use-coach-data";
import { usePlanStore } from "@/stores";

export default function AthleteCareerPage({ params }: { params: { id: string } }) {
  const query = useAthleteDetailQuery(params.id);
  const [inlineError, setInlineError] = useState("");
  const draftPlan = usePlanStore((state) => state.draftPlan);
  const updateBlocks = usePlanStore((state) => state.updateBlocks);
  const validatePlan = usePlanStore((state) => state.validatePlan);

  if (!query.data) {
    return <div>Loading...</div>;
  }

  const goal = query.data.goal;
  const blocks = draftPlan.length > 0 ? draftPlan : query.data.plan.periodization_blocks.map((block, index) => ({
    id: `block-${index}`,
    blockName: block.block_name,
    startDate: block.start_date,
    endDate: block.end_date,
    focusAreas: block.focus_areas,
    volumeTarget: Number(block.volume_target)
  }));

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }
    const items = [...blocks];
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    updateBlocks(items);
    const overlaps = validatePlan();
    setInlineError(overlaps.length > 0 ? "Blocks overlap. Adjust timeline before saving." : "");
  };

  const daysToTarget = Math.ceil((new Date(goal.target_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const talentHistory = query.data.talentSignals;
  const milestoneItems = useMemo(() => ["National camp selection", "Top-3 season ranking", "Peak event execution"], []);

  return (
    <div className="space-y-6">
      <Card className="space-y-3">
        <h2 className="text-xl font-bold">Active goal</h2>
        <p className="text-lg font-semibold">{goal.priority_event ?? goal.goal_type}</p>
        <p className="text-sm text-[#5F5E5A]">{daysToTarget} days to target</p>
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Periodization plan builder</h2>
          <Link href={`/plans/${params.id}`}>
            <Button>Open full builder</Button>
          </Link>
        </div>
        {inlineError ? <p className="rounded-2xl bg-[#FCEBEB] px-4 py-3 text-sm text-[#A32D2D]">{inlineError}</p> : null}
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="blocks">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                {blocks.map((block, index) => (
                  <Draggable key={block.id} draggableId={block.id} index={index}>
                    {(draggableProvided) => (
                      <div
                        ref={draggableProvided.innerRef}
                        {...draggableProvided.draggableProps}
                        {...draggableProvided.dragHandleProps}
                        className="rounded-2xl border border-[#D3D1C7] bg-[#F1EFE8] px-4 py-3"
                      >
                        <p className="font-semibold">{block.blockName}</p>
                        <p className="text-xs text-[#5F5E5A]">
                          {block.startDate} → {block.endDate} · {block.focusAreas.join(", ")}
                        </p>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="space-y-4">
          <h2 className="text-xl font-bold">Milestone timeline</h2>
          {milestoneItems.map((item, index) => (
            <div key={item} className="rounded-2xl bg-[#F1EFE8] px-4 py-3">
              <p className="font-semibold">{item}</p>
              <p className="text-xs text-[#5F5E5A]">{index === 0 ? "Achieved" : "Upcoming"}</p>
            </div>
          ))}
        </Card>
        <Card className="space-y-4">
          <h2 className="text-xl font-bold">Talent signal history</h2>
          {talentHistory.map((signal) => (
            <div key={signal.id} className="rounded-2xl bg-[#F1EFE8] px-4 py-3">
              <p className="font-semibold capitalize">{signal.signal_type}</p>
              <p className="text-xs text-[#5F5E5A]">{String(signal.evidence[0]?.title ?? "")}</p>
            </div>
          ))}
        </Card>
      </div>
    </div>
  );
}
