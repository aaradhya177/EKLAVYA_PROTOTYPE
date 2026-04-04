"use client";

import { DragDropContext, Draggable, Droppable, type DropResult } from "react-beautiful-dnd";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { coachApi } from "@/lib/api";
import { athletes, careerGoals, type PlanBlock } from "@/lib/mock-data";
import { usePlanStore } from "@/stores";

const focusOptions = ["strength", "speed", "endurance", "technique", "recovery"] as const;

export default function PlanBuilderPage({ params }: { params: { athleteId: string } }) {
  const router = useRouter();
  const athlete = athletes.find((item) => item.id === params.athleteId) ?? athletes[0];
  const goal = careerGoals.find((item) => item.athlete_id === athlete.id) ?? careerGoals[0];
  const { draftPlan, addBlock, removeBlock, updateBlocks, validatePlan } = usePlanStore();
  const [form, setForm] = useState<PlanBlock>({
    id: "draft-block",
    blockName: "",
    startDate: "2025-03-01",
    endDate: "2025-03-21",
    focusAreas: ["speed"],
    volumeTarget: 5
  });
  const [toast, setToast] = useState("");

  const overlaps = useMemo(() => validatePlan(), [draftPlan, validatePlan]);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return;
    }
    const items = [...draftPlan];
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    updateBlocks(items);
  };

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Select value={athlete.id} onChange={() => undefined}>
            <option value={athlete.id}>{athlete.name}</option>
          </Select>
          <Select value={goal.id}>
            <option value={goal.id}>{goal.priority_event ?? goal.goal_type}</option>
          </Select>
          <Input placeholder="Block name" value={form.blockName} onChange={(event) => setForm((state) => ({ ...state, blockName: event.target.value }))} />
          <Input type="date" value={form.startDate} onChange={(event) => setForm((state) => ({ ...state, startDate: event.target.value }))} />
          <Input type="date" value={form.endDate} onChange={(event) => setForm((state) => ({ ...state, endDate: event.target.value }))} />
          <Input
            type="number"
            value={String(form.volumeTarget)}
            onChange={(event) => setForm((state) => ({ ...state, volumeTarget: Number(event.target.value) }))}
          />
          <Select
            value={form.focusAreas[0]}
            onChange={(event) => setForm((state) => ({ ...state, focusAreas: [event.target.value] }))}
          >
            {focusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
          <Button
            onClick={() =>
              addBlock({
                ...form,
                id: `${form.blockName}-${Date.now()}`
              })
            }
          >
            Add block
          </Button>
        </div>
        {overlaps.length > 0 ? <p className="rounded-2xl bg-[#FCEBEB] px-4 py-3 text-sm text-[#A32D2D]">Overlapping blocks highlighted in red.</p> : null}
      </Card>

      <Card className="space-y-4">
        <h2 className="text-xl font-bold">Visual timeline preview</h2>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="plan-blocks">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                {draftPlan.map((block, index) => {
                  const error = overlaps.includes(block.id);
                  return (
                    <Draggable key={block.id} draggableId={block.id} index={index}>
                      {(draggableProvided) => (
                        <div
                          ref={draggableProvided.innerRef}
                          {...draggableProvided.draggableProps}
                          {...draggableProvided.dragHandleProps}
                          className={`rounded-2xl px-4 py-3 ${error ? "bg-[#FCEBEB]" : "bg-[#F1EFE8]"}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{block.blockName}</p>
                              <p className="text-xs text-[#5F5E5A]">
                                {block.startDate} → {block.endDate} · {block.focusAreas.join(", ")} · {block.volumeTarget} sessions/week
                              </p>
                            </div>
                            <button className="text-sm text-[#A32D2D]" onClick={() => removeBlock(block.id)}>
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </Card>

      <div className="flex items-center gap-3">
        <Button
          onClick={async () => {
            await coachApi.savePlan(athlete.id, draftPlan);
            setToast("Plan saved successfully");
            router.push(`/athletes/${athlete.id}/career`);
          }}
        >
          Submit plan
        </Button>
        {toast ? <p className="text-sm font-semibold text-[#0F6E56]">{toast}</p> : null}
      </div>
    </div>
  );
}
