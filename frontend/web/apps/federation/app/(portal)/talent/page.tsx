"use client";

import Link from "next/link";
import { DragDropContext, Draggable, Droppable, type DropResult } from "react-beautiful-dnd";
import { useState } from "react";

import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useTalentBoardStore } from "@/stores";

const columns = ["Emerging", "State Level", "National Contender", "Elite", "Olympic Potential"] as const;

export default function TalentBoardPage() {
  const [sportFilter, setSportFilter] = useState("all");
  const athletesByTier = useTalentBoardStore((state) => state.athletesByTier);
  const moveAthlete = useTalentBoardStore((state) => state.moveAthlete);

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const destinationTier = result.destination.droppableId as (typeof columns)[number];
    moveAthlete(result.draggableId, destinationTier);
  };

  return (
    <div className="space-y-6">
      <Card className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Talent identification board</h1>
          <p className="text-sm text-[#5F5E5A]">Promote or demote talent pipeline tiers with drag-and-drop.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={sportFilter} onChange={(event) => setSportFilter(event.target.value)}>
            <option value="all">All sports</option>
            <option value="Athletics">Athletics</option>
            <option value="Boxing">Boxing</option>
            <option value="Hockey">Hockey</option>
          </Select>
          <Link href="/talent/emerging" className="text-sm font-semibold text-[#534AB7]">View emerging list</Link>
        </div>
      </Card>
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid gap-4 xl:grid-cols-5">
          {columns.map((column) => (
            <Droppable key={column} droppableId={column}>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="rounded-[24px] bg-white p-4">
                  <h2 className="mb-4 text-base font-bold">{column}</h2>
                  <div className="space-y-3">
                    {athletesByTier
                      .filter((athlete) => athlete.tier === column && (sportFilter === "all" || athlete.sport === sportFilter))
                      .map((athlete, index) => (
                        <Draggable key={athlete.athleteId} draggableId={athlete.athleteId} index={index}>
                          {(draggableProvided) => (
                            <div
                              ref={draggableProvided.innerRef}
                              {...draggableProvided.draggableProps}
                              {...draggableProvided.dragHandleProps}
                              className={`rounded-2xl border px-4 py-3 ${athlete.highlighted ? "border-[#FAC775] bg-[#FAEEDA]" : "border-[#D3D1C7] bg-[#F1EFE8]"}`}
                            >
                              <p className="font-semibold">{athlete.name}</p>
                              <p className="text-xs text-[#5F5E5A]">{athlete.sport}</p>
                              <p className="mt-2 text-xs text-[#5F5E5A]">Top index {athlete.topIndex}</p>
                              <p className="text-xs text-[#5F5E5A]">{athlete.recentSignal}</p>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                </div>
              )}
            </Droppable>
          ))}
        </div>
      </DragDropContext>
    </div>
  );
}
