import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import * as lodashGet from "lodash.get";

import { useMachine } from ".";

const simpleMachineConfig = {
  id: "light",
  initial: "green",
  states: {
    green: {
      on: { TIMER: "yellow" },
    },
    yellow: {
      on: { TIMER: "red" },
    },
    red: {
      on: { TIMER: "green" },
    },
  },
};

const simpleMachineConfigWithSideEffect = {
  id: "switch",
  initial: "off",
  states: {
    off: {
      on: {
        '': {
          target: "on",
          actions: ["switched"],
        },
      },
    },
    on: {},
  },
};

describe("testing useMachine", () => {
  it("should successfully render a component with a simple machine and call useEffect", () => {
    const spy = jest.spyOn<any, any>(React, "useEffect");

    const SimpleTestComponent = () => {
      const machine = useMachine(simpleMachineConfig, {}, {});

      return (
        <div>{machine.state.value}</div>
      )
    };

    let testComponent = TestRenderer.create(<SimpleTestComponent />);
    const renderedJSON = testComponent.toJSON();
    expect(lodashGet(renderedJSON, 'children[0]'))
      .toBe("green");
    testComponent && testComponent.unmount();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("should successfully re-render an updated component when send is called to change machine state", () => {
    const TestComponentWithAction = () => {
      const machine = useMachine(simpleMachineConfig, {}, {});

      const sendTimer = () => {
        machine.send("TIMER");
      };

      return (
        <React.Fragment>
          <div>{machine.state.value}</div>
          <button onClick={sendTimer}></button>
        </React.Fragment>
      )
    };

    const testComponent = TestRenderer.create(<TestComponentWithAction />);
    // check starting component state
    const initialRenderedJSON = testComponent.toJSON();
    expect(lodashGet(initialRenderedJSON, '[0].children[0]'))
      .toBe("green");
    // click button
    TestRenderer.act(() => testComponent.root && testComponent.root.findByType("button").props.onClick());
    const afterClickRenderedJSON = testComponent.toJSON();
    // check component state after click
    expect(lodashGet(afterClickRenderedJSON, '[0].children[0]'))
      .toBe("yellow");
  });

  it("should successfully execute a side-effect when one is included in the machine config", () => {
    const actions = {
      switched: () => null
    }

    const spy = jest.spyOn<any, any>(actions, "switched")

    const TestComponentWithSideEffect = () => {
      const machine = useMachine(
        simpleMachineConfigWithSideEffect,
        {
          actions: {
            switched: actions.switched,
          },
        },
        {}
      );

      return null;
    };

    TestRenderer.create(<TestComponentWithSideEffect />);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
