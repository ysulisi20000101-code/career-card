import type { ArchitectureModule, CareerKind, TimelineNode } from "@/types";

/**
 * Recompute architecture node positions with a tree-like layout:
 * - Root node at the top center
 * - Child nodes grouped by careerKind (internship vs fulltime)
 * - Y offset based on depth level
 */
export function improveArchitectureLayout(
  modules: ArchitectureModule[],
  timeline: TimelineNode[],
): ArchitectureModule[] {
  if (modules.length === 0) return modules;

  const root = modules.find((m) => m.parentId === null);
  if (!root) return modules;

  const children = modules.filter((m) => m.parentId === root.id);
  if (children.length === 0) return modules;

  // Build a lookup from timeline id to careerKind
  const timelineKindMap = new Map<string, CareerKind>();
  for (const node of timeline) {
    if (node.careerKind) {
      timelineKindMap.set(node.id, node.careerKind);
    }
  }

  // Classify children by careerKind
  const internNodes: ArchitectureModule[] = [];
  const fulltimeNodes: ArchitectureModule[] = [];
  const unknownNodes: ArchitectureModule[] = [];

  for (const child of children) {
    const kinds = child.relatedTimelineIds
      .map((id) => timelineKindMap.get(id))
      .filter(Boolean);
    const kind = kinds[0];
    if (kind === "internship") internNodes.push(child);
    else if (kind === "fulltime") fulltimeNodes.push(child);
    else unknownNodes.push(child);
  }

  // Sort each group by original x position to preserve order
  const sortByX = (a: ArchitectureModule, b: ArchitectureModule) => a.position.x - b.position.x;
  internNodes.sort(sortByX);
  fulltimeNodes.sort(sortByX);
  unknownNodes.sort(sortByX);

  // Layout: fulltime first, then internships, then unknown
  const orderedChildren = [...fulltimeNodes, ...internNodes, ...unknownNodes];
  const nodeWidth = 220;
  const gap = 40;
  const totalWidth = orderedChildren.length * (nodeWidth + gap) - gap;
  const startX = -totalWidth / 2 + 350; // center around root x=350

  return modules.map((m) => {
    if (m.id === root.id) {
      return { ...m, position: { x: 350, y: 0 } };
    }
    const childIndex = orderedChildren.findIndex((c) => c.id === m.id);
    if (childIndex === -1) return m;
    return {
      ...m,
      position: {
        x: startX + childIndex * (nodeWidth + gap),
        y: 200,
      },
    };
  });
}
