import { StepMocker } from "@aj/step-mocker/step-mocker";
import { existsSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import path from "path";
import { parse, stringify } from "yaml";

jest.mock("fs");
const readFileMock = readFile as jest.Mock;
const existsSyncMock = existsSync as jest.Mock;
const writeFileMock = writeFile as jest.Mock;
const resources = path.resolve(__dirname, "..", "resources", "step-mocker");

describe("getWorkflowPath", () => {
  test("found in the current directory", async () => {
    existsSyncMock.mockReturnValueOnce(true);
    readFileMock.mockResolvedValueOnce("name: Workflow");
    writeFileMock.mockResolvedValueOnce(undefined);
    const cwd = __dirname;
    const workflowFile = "workflow.yaml";
    const stepMocker = new StepMocker(workflowFile, cwd);
    await stepMocker.mock({});
    expect(existsSyncMock).toHaveBeenCalledWith(path.join(cwd, workflowFile));
    expect(readFileMock).toHaveBeenCalledWith(
      path.join(cwd, workflowFile),
      "utf8"
    );
    expect(writeFileMock).toHaveBeenCalledWith(
      path.join(cwd, workflowFile),
      "name: Workflow\n",
      "utf8"
    );
  });

  test("found in workflow directory when cwd is in a .github dir", async () => {
    existsSyncMock.mockReturnValueOnce(false);
    readFileMock.mockResolvedValueOnce("name: Workflow");
    writeFileMock.mockResolvedValueOnce(undefined);
    const cwd = path.join(__dirname, ".github");
    const workflowFile = "workflow.yaml";
    const stepMocker = new StepMocker(workflowFile, cwd);
    await stepMocker.mock({});
    expect(existsSyncMock).toHaveBeenCalledWith(path.join(cwd, workflowFile));
    expect(readFileMock).toHaveBeenCalledWith(
      path.join(cwd, "workflows", workflowFile),
      "utf8"
    );
    expect(writeFileMock).toHaveBeenCalledWith(
      path.join(cwd, "workflows", workflowFile),
      "name: Workflow\n",
      "utf8"
    );
  });

  test("found in the .github/workflows directory", async () => {
    existsSyncMock.mockReturnValueOnce(false).mockReturnValueOnce(true);
    readFileMock.mockResolvedValueOnce("name: Workflow");
    writeFileMock.mockResolvedValueOnce(undefined);
    const cwd = __dirname;
    const workflowFile = "workflow.yaml";
    const stepMocker = new StepMocker(workflowFile, cwd);
    await stepMocker.mock({});
    expect(existsSyncMock).toHaveBeenNthCalledWith(
      1,
      path.join(cwd, workflowFile)
    );
    expect(existsSyncMock).toHaveBeenNthCalledWith(
      2,
      path.join(cwd, ".github", "workflows", workflowFile)
    );
    expect(readFileMock).toHaveBeenCalledWith(
      path.join(cwd, ".github", "workflows", workflowFile),
      "utf8"
    );
    expect(writeFileMock).toHaveBeenCalledWith(
      path.join(cwd, ".github", "workflows", workflowFile),
      "name: Workflow\n",
      "utf8"
    );
  });

  test("could not find workflow", async () => {
    existsSyncMock.mockReturnValueOnce(false).mockReturnValueOnce(false);
    readFileMock.mockResolvedValueOnce("name: Workflow");
    writeFileMock.mockResolvedValueOnce(undefined);
    const cwd = __dirname;
    const workflowFile = "workflow.yaml";
    const stepMocker = new StepMocker(workflowFile, cwd);
    await expect(stepMocker.mock({})).rejects.toThrowError();
    expect(existsSyncMock).toHaveBeenNthCalledWith(
      1,
      path.join(cwd, workflowFile)
    );
    expect(existsSyncMock).toHaveBeenNthCalledWith(
      2,
      path.join(cwd, ".github", "workflows", workflowFile)
    );
  });
});

describe("locateSteps", () => {
  beforeEach(() => {
    existsSyncMock.mockReturnValueOnce(true);
    writeFileMock.mockResolvedValueOnce(undefined);
  });
  test("no job found", async () => {
    readFileMock.mockResolvedValueOnce(
      await readFile(path.join(resources, "steps.yaml"), "utf8")
    );
    const stepMocker = new StepMocker("workflow.yaml", __dirname);
    await expect(
      stepMocker.mock({
        incorrectName: [
          {
            name: "step",
            mockWith: "echo step",
          },
        ],
      })
    ).rejects.toThrowError();
  });

  test("step found using id", async () => {
    const data = await readFile(path.join(resources, "steps.yaml"), "utf8");
    readFileMock.mockResolvedValueOnce(data);
    const stepMocker = new StepMocker("workflow.yaml", __dirname);
    await stepMocker.mock({
      name: [
        {
          id: "echo",
          mockWith: "echo step",
        },
      ],
    });
    const workflow = stringify(
      parse(data.replace("echo \"pull request\"", "echo step"))
    );
    expect(writeFileMock).toHaveBeenLastCalledWith(
      path.join(__dirname, "workflow.yaml"),
      workflow,
      "utf8"
    );
  });

  test("step found using name", async () => {
    const data = await readFile(path.join(resources, "steps.yaml"), "utf8");
    readFileMock.mockResolvedValueOnce(data);
    const stepMocker = new StepMocker("workflow.yaml", __dirname);
    await stepMocker.mock({
      name: [
        {
          name: "secrets",
          mockWith: "echo step",
        },
      ],
    });
    const workflow = stringify(parse(data.replace("echo $TEST1", "echo step")));
    expect(writeFileMock).toHaveBeenLastCalledWith(
      path.join(__dirname, "workflow.yaml"),
      workflow,
      "utf8"
    );
  });

  test("step found using uses", async () => {
    const data = await readFile(path.join(resources, "steps.yaml"), "utf8");
    readFileMock.mockResolvedValueOnce(data);
    const stepMocker = new StepMocker("workflow.yaml", __dirname);
    await stepMocker.mock({
      name: [
        {
          uses: "actions/checkout@v3",
          mockWith: "echo step",
        },
      ],
    });
    const workflow = stringify(
      parse(data.replace("uses: actions/checkout@v3", "run: echo step"))
    );
    expect(writeFileMock).toHaveBeenLastCalledWith(
      path.join(__dirname, "workflow.yaml"),
      workflow,
      "utf8"
    );
  });

  test("step found using run", async () => {
    const data = await readFile(path.join(resources, "steps.yaml"), "utf8");
    readFileMock.mockResolvedValueOnce(data);
    const stepMocker = new StepMocker("workflow.yaml", __dirname);
    await stepMocker.mock({
      name: [
        {
          run: "echo run",
          mockWith: "echo step",
        },
      ],
    });
    const workflow = stringify(parse(data.replace("echo run", "echo step")));
    expect(writeFileMock).toHaveBeenLastCalledWith(
      path.join(__dirname, "workflow.yaml"),
      workflow,
      "utf8"
    );
  });
});

describe("mock", () => {
  beforeEach(async () => {
    existsSyncMock.mockReturnValueOnce(true);
    writeFileMock.mockResolvedValueOnce(undefined);
    readFileMock.mockResolvedValueOnce(
      await readFile(path.join(resources, "steps.yaml"), "utf8")
    );
  });

  test("mockWith is a string", async () => {
    const stepMocker = new StepMocker("workflow.yaml", __dirname);
    await stepMocker.mock({
      name: [
        {
          run: "echo run",
          mockWith: "echo step",
        },
        {
          uses: "actions/checkout@v3",
          mockWith: "echo checkout"
        }
      ],
    });

    expect(parse(writeFileMock.mock.calls[0][1])).toMatchObject({
      jobs: {
        name: {
          steps: expect.arrayContaining([
            {
              run: "echo checkout",
            },
            {
              run: "echo step",
            },
          ]),
        },
      },
    });
  });

  test("mockWith is a Step", async () => {
    const stepMocker = new StepMocker("workflow.yaml", __dirname);
    await stepMocker.mock({
      name: [
        {
          uses: "actions/checkout@v3",
          mockWith: {
            uses: "actions/setup-node",
            with: {
              nodeVersion: 16
            }
          }
        },
        {
          name: "secrets",
          mockWith: {
            env: {
              TEST1: "val",
            },
            name: undefined // try deleting the field
          }
        }
      ],
    });
    expect(parse(writeFileMock.mock.calls[0][1])).toMatchObject({
      jobs: {
        name: {
          steps: expect.arrayContaining([
            {
              run: "echo $TEST1",
              env: {
                TEST1: "val"
              }
            },
            {
              uses: "actions/setup-node",
              with: {
                nodeVersion: 16
              }
            },
          ]),
        },
      },
    });
  });
});
