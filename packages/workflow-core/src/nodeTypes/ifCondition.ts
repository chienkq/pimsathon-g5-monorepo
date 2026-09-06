import type { NodeExecutionData, NodeTypeDefinition } from "../types.js";
import { evaluateCondition, getByPath } from "../utils.js";

export const ifConditionNodeType: NodeTypeDefinition = {
  type: "ifCondition",
  displayName: "IF",
  description: "Routes each item to the true or false branch based on a condition.",
  group: "logic",
  color: "#9b2226",
  hasInput: true,
  outputs: ["true", "false"],
  parameters: [
    { key: "field", label: "Field (dot path)", type: "string", default: "", placeholder: "data.status" },
    {
      key: "operator",
      label: "Operator",
      type: "select",
      default: "equals",
      options: [
        { label: "Equals", value: "equals" },
        { label: "Not Equals", value: "notEquals" },
        { label: "Contains", value: "contains" },
        { label: "Greater Than", value: "greaterThan" },
        { label: "Less Than", value: "lessThan" },
        { label: "Is Empty", value: "isEmpty" },
        { label: "Is Not Empty", value: "isNotEmpty" },
      ],
    },
    { key: "value", label: "Value", type: "string", default: "" },
  ],
  async execute({ parameters, input }) {
    const field = String(parameters.field ?? "");
    const operator = String(parameters.operator ?? "equals");
    const compareValue = parameters.value;

    const trueItems: NodeExecutionData[] = [];
    const falseItems: NodeExecutionData[] = [];
    for (const item of input) {
      const actual = getByPath(item.json, field);
      if (evaluateCondition(actual, operator, compareValue)) {
        trueItems.push(item);
      } else {
        falseItems.push(item);
      }
    }
    return { branches: { true: trueItems, false: falseItems } };
  },
};
