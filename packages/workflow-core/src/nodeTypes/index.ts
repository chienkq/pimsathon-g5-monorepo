import type { NodeTypeDefinition } from "../types.js";
import { codeNodeType } from "./code.js";
import { httpRequestNodeType } from "./httpRequest.js";
import { ifConditionNodeType } from "./ifCondition.js";
import { manualTriggerNodeType } from "./manualTrigger.js";
import { mergeNodeType } from "./merge.js";
import { noOpNodeType } from "./noOp.js";
import { setFieldsNodeType } from "./setFields.js";

export const nodeTypeRegistry: Record<string, NodeTypeDefinition> = {
  [manualTriggerNodeType.type]: manualTriggerNodeType,
  [setFieldsNodeType.type]: setFieldsNodeType,
  [httpRequestNodeType.type]: httpRequestNodeType,
  [ifConditionNodeType.type]: ifConditionNodeType,
  [codeNodeType.type]: codeNodeType,
  [mergeNodeType.type]: mergeNodeType,
  [noOpNodeType.type]: noOpNodeType,
};

export function getNodeType(type: string): NodeTypeDefinition {
  const nodeType = nodeTypeRegistry[type];
  if (!nodeType) throw new Error(`Unknown node type: ${type}`);
  return nodeType;
}

export function listNodeTypes(): NodeTypeDefinition[] {
  return Object.values(nodeTypeRegistry);
}

export {
  codeNodeType,
  httpRequestNodeType,
  ifConditionNodeType,
  manualTriggerNodeType,
  mergeNodeType,
  noOpNodeType,
  setFieldsNodeType,
};
