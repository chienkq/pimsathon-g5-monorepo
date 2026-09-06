import { LocalStorageWorkflowRepository, type WorkflowRepository } from "@chienkq/workflow-core";
import { createContext, type ReactNode, useContext, useMemo } from "react";

const WorkflowRepositoryContext = createContext<WorkflowRepository | null>(null);

export interface WorkflowRepositoryProviderProps {
  /** Defaults to a `localStorage`-backed repository. Pass your own (e.g. HTTP-backed) implementation later. */
  repository?: WorkflowRepository;
  children: ReactNode;
}

export function WorkflowRepositoryProvider({ repository, children }: WorkflowRepositoryProviderProps) {
  const value = useMemo(() => repository ?? new LocalStorageWorkflowRepository(), [repository]);
  return <WorkflowRepositoryContext.Provider value={value}>{children}</WorkflowRepositoryContext.Provider>;
}

export function useWorkflowRepository(): WorkflowRepository {
  const repository = useContext(WorkflowRepositoryContext);
  if (!repository) {
    throw new Error("useWorkflowRepository must be used within a WorkflowRepositoryProvider");
  }
  return repository;
}
