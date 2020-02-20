import { useState, useMemo, useEffect, useRef } from "react";
import {
  Machine,
  MachineConfig,
  EventObject,
  MachineOptions,
  OmniEvent,
  State,
  StateSchema,
  DefaultContext
} from "xstate";
import { interpret, Interpreter } from "xstate/lib/interpreter";

export function useMachine<
  TStateSchema extends StateSchema,
  TEvent extends EventObject = EventObject,
  TContext = DefaultContext
>(
  config: MachineConfig<TContext, TStateSchema, TEvent>,
  options: Partial<MachineOptions<TContext, TEvent>>,
  initialContext: TContext
): TCreateContext<TContext, TStateSchema, TEvent> {
  const machine = useMemo(
    () =>
      Machine<TContext, TStateSchema, TEvent>(config, options, initialContext),
    []
  );
  const [state, setState] = useState(machine.initialState);
  const [context, setContext] = useState(initialContext);
  const service = useMemo(() => {
    const service = interpret(machine);
    service.onTransition(setState);
    service.onChange(setContext);
    service.init();
    return service;
  }, [machine]);

  // Stop the service when unmounting.
  useEffect(() => {
    return () => void service.stop();
  }, [service]);

  return { state, send: service.send, context, service };
}

export type TCreateContext<
  TContext,
  TStateSchema,
  TEvent extends EventObject
> = {
  state: State<TContext, TEvent>;
  context: TContext;
  send: TSendFn<TContext, TEvent>;
  service: Interpreter<TContext, TStateSchema, TEvent>;
};

type TSendFn<TContext, TEvent extends EventObject> = (
  event: OmniEvent<TEvent>
) => State<TContext, TEvent>;
