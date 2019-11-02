import * as React from "react";
import * as TestRenderer from "react-test-renderer";
import { get as lodashGet } from "lodash";

import { useMachine } from ".";
import { MachineConfig } from "xstate";

// simple ----------------------------------

enum SimpleStateName {
  GREEN = "GREEN",
  YELLOW = "YELLOW",
  RED = "RED"
}

interface SimpleStateSchema {
  states: {
    [SimpleStateName.GREEN]: {};
    [SimpleStateName.YELLOW]: {};
    [SimpleStateName.RED]: {};
  };
}

enum SimpleAction {
  TIMER = "TIMER"
}

type SimpleEvents = { type: SimpleAction.TIMER };

interface SimpleContext {
  counter: number;
}

const SimpleInitialContext: SimpleContext = {
  counter: 0
};

const simpleMachineConfig: MachineConfig<
  SimpleContext,
  SimpleStateSchema,
  SimpleEvents
> = {
  id: "light",
  initial: SimpleStateName.GREEN,
  states: {
    [SimpleStateName.GREEN]: {
      on: { TIMER: SimpleStateName.YELLOW }
    },
    [SimpleStateName.YELLOW]: {
      on: { TIMER: SimpleStateName.RED }
    },
    [SimpleStateName.RED]: {
      on: { TIMER: SimpleStateName.GREEN }
    }
  }
};

// side effect ----------------------------------

enum SimpleStateNameWithSideEffect {
  OFF = "OFF",
  ON = "ON"
}

interface SimpleStateSchemaWithSideEffect {
  states: {
    [SimpleStateNameWithSideEffect.OFF]: {};
    [SimpleStateNameWithSideEffect.ON]: {};
  };
}

enum SimpleActionWithSideEffect {
  ACTIVATE = "ACTIVATE",
  DEACTIVATE = "DEACTIVATE"
}

enum SimpleCallbackActionWithSideEffect {
  SWITCHED = "SWITCHED"
}

type SimpleEventsWithSideEffect =
  | { type: SimpleActionWithSideEffect.ACTIVATE }
  | { type: SimpleActionWithSideEffect.DEACTIVATE };

interface SimpleContextWithSideEffect {
  counter: number;
}

const simpleInitialContextWithSideEffect: SimpleContextWithSideEffect = {
  counter: 0
};

const simpleMachineConfigWithSideEffect: MachineConfig<
  SimpleContextWithSideEffect,
  SimpleStateSchemaWithSideEffect,
  SimpleEventsWithSideEffect
> = {
  id: "switch",
  initial: SimpleStateNameWithSideEffect.OFF,
  states: {
    [SimpleStateNameWithSideEffect.OFF]: {
      on: {
        "": {
          target: SimpleStateNameWithSideEffect.ON,
          actions: [SimpleCallbackActionWithSideEffect.SWITCHED]
        }
      }
    },
    [SimpleStateNameWithSideEffect.ON]: {}
  }
};

describe("testing useMachine", () => {
  it("should successfully render a component with a simple machine and call useEffect", () => {
    const spy = jest.spyOn<any, any>(React, "useEffect");

    const SimpleTestComponent = () => {
      const machine = useMachine(simpleMachineConfig, {}, SimpleInitialContext);

      return <div>{machine.state.value}</div>;
    };

    let testComponent = TestRenderer.create(<SimpleTestComponent />);
    const renderedJSON = testComponent.toJSON();
    expect(lodashGet(renderedJSON, "children[0]")).toBe(SimpleStateName.GREEN);
    testComponent && testComponent.unmount();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it("should successfully re-render an updated component when send is called to change machine state", () => {
    const TestComponentWithAction = () => {
      const machine = useMachine(simpleMachineConfig, {}, SimpleInitialContext);

      const sendTimer = () => {
        machine.send(SimpleAction.TIMER);
      };

      return (
        <React.Fragment>
          <div>{machine.state.value}</div>
          <button onClick={sendTimer}></button>
        </React.Fragment>
      );
    };

    const testComponent = TestRenderer.create(<TestComponentWithAction />);
    // check starting component state
    const initialRenderedJSON = testComponent.toJSON();
    expect(lodashGet(initialRenderedJSON, "[0].children[0]")).toBe(
      SimpleStateName.GREEN
    );
    // click button
    TestRenderer.act(
      () =>
        testComponent.root &&
        testComponent.root.findByType("button").props.onClick()
    );
    const afterClickRenderedJSON = testComponent.toJSON();
    // check component state after click
    expect(lodashGet(afterClickRenderedJSON, "[0].children[0]")).toBe(
      SimpleStateName.YELLOW
    );
  });

  it("should successfully execute a side-effect when one is included in the machine config", () => {
    const spy = jest.fn();
    const actionsMock = {
      switched: spy
    };

    const TestComponentWithSideEffect = () => {
      const machine = useMachine(
        simpleMachineConfigWithSideEffect,
        {
          actions: {
            [SimpleCallbackActionWithSideEffect.SWITCHED]: actionsMock.switched
          }
        },
        simpleInitialContextWithSideEffect
      );

      return null;
    };

    TestRenderer.create(<TestComponentWithSideEffect />);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
