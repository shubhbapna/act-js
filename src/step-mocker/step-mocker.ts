import {
  CompositeAction,
  CompositeStepIdentifier,
  GithubWorkflow,
  GithubWorkflowStep,
  isCompositeAction,
  isCompositeStepIdentifier,
  isStepIdentifierUsingId,
  isStepIdentifierUsingName,
  isStepIdentifierUsingRun,
  isStepIdentifierUsingUses,
  isWorkflowStepIdentifier,
  MockStep,
  StepIdentifier,
  WorkflowStepIdentifier,
} from "@aj/step-mocker/step-mocker.types";
import { existsSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { parse, stringify } from "yaml";

export class StepMocker {
  private workflowFile: string;
  private cwd: string;
  constructor(workflowFile: string, cwd: string) {
    this.workflowFile = workflowFile;
    this.cwd = cwd;
  }

  async mock(mockSteps: MockStep, cwd = this.cwd, workflowFile = this.workflowFile) {
    const filePath = this.getWorkflowPath(cwd, workflowFile);
    const workflow = await this.readWorkflowFile(filePath);
    if (isCompositeAction(workflow)) {

    } else {
      for (const job of Object.keys(mockSteps)) {
        for (const mockStep of mockSteps[job]) {
          if (isWorkflowStepIdentifier(mockStep)) {
            this.handleWorkflowStep(mockStep, workflow, job)
          } else if (isCompositeStepIdentifier(mockStep)) {
            // read local composite file. path is relative to the root of the repository
            // mock steps in it (recursively? what if it refers to another composite action)
            this.handleCompositeStep(mockStep, workflow, job, filePath)
          } else {
  
          }
        }
      }
    }
    return this.writeWorkflowFile(filePath, workflow);
  }

  private handleWorkflowStep(
    mockStep: WorkflowStepIdentifier, 
    workflow: GithubWorkflow,
    job: string
  ) {
    const { step, stepIndex } = this.locateStep(workflow, job, mockStep);

    if (typeof mockStep.mockWith === "string") {
      this.updateStep(workflow, job, stepIndex, {
        ...step,
        run: mockStep.mockWith,
        uses: undefined,
      });
    } else {
      this.updateStep(workflow, job, stepIndex, mockStep.mockWith);
    }
  }

  private handleCompositeStep(
    mockStep: CompositeStepIdentifier,
    workflow: GithubWorkflow,
    job: string,
    parentWorkflowFilePath: string
  ) {
    const { step, stepIndex } = this.locateStep(workflow, job, mockStep);
    if (!step.uses && !step.uses?.startsWith("./")) {
      throw new Error("Located composite action does not seem to use a local composite action")
    }

    // the path of composite action is relative to the root of the repository
    // assuming that the parent workflow file is in ".github/workflows" directory, we will move out of the ".github" directory
    const { cwd, workflowFile } = this.getCompositeActionPath(path.resolve(parentWorkflowFilePath, "..", ".."), step.uses) 




  }

  private updateStep(
    workflow: GithubWorkflow,
    jobId: string,
    stepIndex: number,
    newStep: GithubWorkflowStep
  ) {
    if (workflow.jobs[jobId]) {
      const oldStep = workflow.jobs[jobId].steps[stepIndex];
      const updatedStep = { ...oldStep, ...newStep };

      for (const key of Object.keys(oldStep)) {
        if (key === "env" || key === "with") {
          updatedStep[key] = {
            ...oldStep[key],
            ...(newStep[key] ?? {}),
          };
        }
      }

      workflow.jobs[jobId].steps[stepIndex] = updatedStep;
    }
  }

  private locateStep(
    workflow: GithubWorkflow,
    jobId: string,
    step: StepIdentifier
  ): { stepIndex: number; step: GithubWorkflowStep } {
    const index = workflow.jobs[jobId]?.steps.findIndex((s) => {
      if (isStepIdentifierUsingId(step)) {
        return step.id === s.id;
      }

      if (isStepIdentifierUsingName(step)) {
        return step.name === s.name;
      }

      if (isStepIdentifierUsingUses(step)) {
        return step.uses === s.uses;
      }

      if (isStepIdentifierUsingRun(step)) {
        return step.run === s.run;
      }
      return false;
    });

    if (index === -1) {
      throw new Error(`Could not find step ${JSON.stringify(step)}`)
    }

    return {
      stepIndex: index,
      step: workflow.jobs[jobId]?.steps[index],
    };
  }

  private getWorkflowPath(cwd: string, workflowFile: string): string {
    if (existsSync(path.join(cwd, workflowFile))) {
      return path.join(cwd, workflowFile);
    }
    if (cwd.endsWith(".github")) {
      return path.join(cwd, "workflows", workflowFile);
    } else if (
      existsSync(path.join(cwd, ".github", "workflows", workflowFile))
    ) {
      return path.join(cwd, ".github", "workflows", workflowFile);
    } else {
      throw new Error(`Could not locate ${workflowFile}`);
    }
  }

  private getCompositeActionPath(cwd: string, workflowFile: string) {
    if (existsSync(path.join(cwd, workflowFile, "action.yml"))) {
      return {cwd, workflowFile: path.join(workflowFile, "action.yml")};
    } else if (existsSync(path.join(cwd, workflowFile, "action.yaml"))) {
      return {cwd, workflowFile: path.join(workflowFile, "action.yaml")};
    } else {
      throw new Error(`Could not locate ${workflowFile}`);
    }
  }

  private async readWorkflowFile(location: string): Promise<GithubWorkflow | CompositeAction> {
    return parse(await readFile(location, "utf8"));
  }

  private async writeWorkflowFile(location: string, data: unknown) {
    return writeFile(location, stringify(data), "utf8");
  }

  private async getReusableWorkflow(location: string) {
    const workflow = await this.readWorkflowFile(location);
    if (isCompositeAction(workflow)) return undefined;
    if (typeof workflow.on === "string") {
      return workflow.on === "workflow_call" ? workflow : undefined;
    }
    return Object.keys(workflow.on).includes("workflow_call")
      ? workflow
      : undefined;
  }

  private async getCompositeAction(location: string) {
    const possibleCompositeAction = parse(await readFile(location, "utf8"));
    if (isCompositeAction(possibleCompositeAction)) {
      return possibleCompositeAction;
    }
  }
}
