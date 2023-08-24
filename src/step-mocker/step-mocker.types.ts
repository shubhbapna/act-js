export type GithubWorkflowStep = {
  /**
   * A name for your step to display on GitHub.
   */
  name?: string;

  /**
   * An identifier for your step.
   */
  id?: string;

  /**
   * Selects an action to run as part of a step in your job. An action is a reusable unit of code. You can use an action defined in the same repository as the workflow, a public repository, or in a published Docker container image.
   */
  uses?: string;

  /**
   * Runs command line programs using the operating system's shell. If you do not provide a name, the step name will default to the run command. Commands run using non-login shells by default.
   */
  run?: string;

  /**
   * A map of the input parameters defined by the action.
   */
  with?: Record<string, string | number | boolean | undefined>;

  /**
   * Sets variables for the step to use during execution.
   */
  env?: Record<string, string | number | boolean | undefined>;

  /**
   * Override the default shell settings in the runner's operating system using the shell keyword.
   */
  shell?: string;

  /**
   * Specify the working directory of where to run the command.
   */
  "working-directory"?: string;

  /**
   * Prevents a job from failing when a step fails. Set to true to allow a job to pass when this step fails.
   */
  "continue-on-error"?: string;

  /**
   * The maximum number of minutes to run the step before killing the process.
   */
  "timeout-minutes"?: string;

  [k: string]: unknown;
};

export type GithubWorkflowJob = {
  /**
   * Each job must have an id to associate with the job. The key job_id is a string and its value is a map of the job's configuration data. You must replace <job_id> with a string that is unique to the jobs object. The <job_id> must start with a letter or _ and contain only alphanumeric characters, -, or _.
   */
  [k: string]: {
    /**
     * The name of the job displayed on GitHub.
     */
    name?: string;

    /**
     * A job contains a sequence of tasks called steps. Steps can run commands, run setup tasks, or run an action in your repository, a public repository, or an action published in a Docker registry. Not all steps run actions, but all actions are run as a step. Each step runs in its own process in the virtual environment and has access to the workspace and filesystem. Because steps are run in their own process, changes to environment variables are not preserved between steps. GitHub provides built-in steps to set up and complete a job.
     */
    steps: GithubWorkflowStep[];
    [k: string]: unknown;
  };
};

export type GithubWorkflow = {
  /**
   * The name of your workflow. GitHub displays the names of your workflows on your repository's actions page. If you omit this field, GitHub sets the name to the workflow's filename.
   */
  name: string;

  /**
   * The event that triggered the workflow
   */
  on: string | Record<string, object>;

  /**
   * A workflow run is made up of one or more jobs. Jobs run in parallel by default. To run jobs sequentially, you can define dependencies on other jobs using the jobs.<job_id>.needs keyword.
   */
  jobs: GithubWorkflowJob;
  [k: string]: unknown;
};

export type MockStep = {
  [job: string]: StepIdentifier[];
};

// added string type to mockWith for backward compatibility
type StepIdentifierUsingName = {
  name: string;
}
type StepIdentifierUsingId = {
  id: string;
}
type StepIdentifierUsingUses = {
  uses: string;
}
type StepIdentifierUsingRun = {
  run: string;
}

type BaseWorkflowStepIdentifier = {
  mockWith: GithubWorkflowStep | string;
}
export type WorkflowStepIdentifierUsingName = StepIdentifierUsingName & BaseWorkflowStepIdentifier;
export type WorkflowStepIdentifierUsingId = StepIdentifierUsingId & BaseWorkflowStepIdentifier;
export type WorkflowStepIdentifierUsingUses = StepIdentifierUsingUses & BaseWorkflowStepIdentifier;
export type WorkflowStepIdentifierUsingRun = StepIdentifierUsingRun & BaseWorkflowStepIdentifier;
export type WorkflowStepIdentifier =
  | WorkflowStepIdentifierUsingName
  | WorkflowStepIdentifierUsingId
  | WorkflowStepIdentifierUsingUses
  | WorkflowStepIdentifierUsingRun;

type BaseCompositeStepIdentifier = {
  mockCompositeAction: StepIdentifier[];
}
export type CompositeStepIdentifierUsingRun = StepIdentifierUsingRun & BaseCompositeStepIdentifier;
export type CompositeStepIdentifierUsingName = StepIdentifierUsingName & BaseCompositeStepIdentifier;
export type CompositeStepIdentifierUsingId = StepIdentifierUsingId & BaseCompositeStepIdentifier;
export type CompositeStepIdentifierUsingUses = StepIdentifierUsingUses & BaseCompositeStepIdentifier;
export type CompositeStepIdentifier =
  | CompositeStepIdentifierUsingName
  | CompositeStepIdentifierUsingId
  | CompositeStepIdentifierUsingUses
  | CompositeStepIdentifierUsingRun;

type BaseReusableStepIdentifier = {
  mockReusableWorkflow: MockStep;
}
export type ReusableStepIdentifierUsingRun = StepIdentifierUsingRun & BaseReusableStepIdentifier;
export type ReusableStepIdentifierUsingName = StepIdentifierUsingName & BaseReusableStepIdentifier;
export type ReusableStepIdentifierUsingId = StepIdentifierUsingId & BaseReusableStepIdentifier;
export type ReusableStepIdentifierUsingUses = StepIdentifierUsingUses & BaseReusableStepIdentifier;
export type ReusableStepIdentifier =
  | ReusableStepIdentifierUsingName
  | ReusableStepIdentifierUsingId
  | ReusableStepIdentifierUsingUses
  | ReusableStepIdentifierUsingRun;

export type StepIdentifier =
  | WorkflowStepIdentifier
  | CompositeStepIdentifier
  | ReusableStepIdentifier;

function hasProperty<
  T extends StepIdentifier,
  K extends string
>(obj: T, key: K): obj is T {
  return Object.prototype.hasOwnProperty.call(obj, key)
}
export function isStepIdentifierUsingName<
T extends ReusableStepIdentifierUsingName | CompositeStepIdentifierUsingName | WorkflowStepIdentifierUsingName,
>(step: StepIdentifier): step is T {
  if (hasProperty(step, "name")) {

  }
  return hasProperty(step, "name") 
}

export function isReusableStepIdentifier (
  step: StepIdentifier
): step is CompositeStepIdentifier {
  return Object.prototype.hasOwnProperty.call(step, "mockReusableWorkflow");
}

export function isCompositeStepIdentifier (
  step: StepIdentifier
): step is CompositeStepIdentifier {
  return Object.prototype.hasOwnProperty.call(step, "mockCompositeAction");
}

export function isWorkflowStepIdentifier (
  step: StepIdentifier
): step is WorkflowStepIdentifier {
  return Object.prototype.hasOwnProperty.call(step, "mockWith");
}

export function isStepIdentifierUsingId(
  step: StepIdentifier
): step is WorkflowStepIdentifierUsingId | CompositeStepIdentifierUsingId | ReusableStepIdentifierUsingId {
  return Object.prototype.hasOwnProperty.call(step, "id");
}

export function isStepIdentifierUsingUses(
  step: StepIdentifier
): step is WorkflowStepIdentifierUsingUses | CompositeStepIdentifierUsingUses | ReusableStepIdentifierUsingUses {
  return Object.prototype.hasOwnProperty.call(step, "uses");
}

export function isStepIdentifierUsingRun(
  step: StepIdentifier
): step is WorkflowStepIdentifierUsingRun | CompositeStepIdentifierUsingRun | ReusableStepIdentifierUsingRun {
  return Object.prototype.hasOwnProperty.call(step, "run");
}

export type CompositeAction = {
  name: string;
  description: string;
  inputs?: {
    [key: string]: {
      description?: string;
      required?: boolean;
      default?: string | number | boolean;
    };
  };
  outputs?: {
    [key: string]: {
      description?: string;
      value?: string;
    };
  };
  runs: {
    using: "composite" | "node16" | "docker";
    steps: GithubWorkflowStep[];
  };
};

export function isCompositeAction(
  workflow: CompositeAction | GithubWorkflow
): workflow is CompositeAction {
  return Object.prototype.hasOwnProperty.call(workflow, "runs");
}
