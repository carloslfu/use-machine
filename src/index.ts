import { useState, useMemo, useEffect } from "react";
import {
  Machine,
  MachineConfig,
  EventObject,
  MachineOptions,
  OmniEvent,
  State,
  StateSchema
} from "xstate";
import { interpret, Interpreter } from "xstate/lib/interpreter";

export function useMachine<
  TContext = any,
  TState extends StateSchema = any,
  TEvent extends EventObject = any
>(
  config: MachineConfig<TContext, TState, TEvent>,
  options: MachineOptions<TContext, TEvent>,
  initialContext: TContext
): {
  state: State<TContext, TEvent>;
  context: TContext;
  send: TSendFn<TContext, TEvent>;
  service: Interpreter<TContext, TState, TEvent>;
} {
  const machine = useMemo(
    () => Machine<TContext, TState, TEvent>(config, options, initialContext),
    []
  );

  const [state, setState] = useState<State<TContext, TEvent>>(
    machine.initialState
  );
  const [context, setContext] = useState<TContext>(machine.context!);

  // Setup the service only once.
  const service = useMemo(() => {
    const service = interpret<TContext, TState, TEvent>(machine);
    service.onTransition(state => setState(state as any));
    service.onChange(context => setContext(context));
    // call init after the above callbacks are set so any immediate actions
    // are reflected in react's state
    service.init();
    return service;
  }, []);

  // Stop the service when unmounting.
  useEffect(() => {
    return () => service.stop();
  }, []);

  return { state, send: service.send, context, service };
}

type TSendFn<TContext, TEvent extends EventObject> = (
  event: OmniEvent<TEvent>
) => State<TContext, TEvent>;
