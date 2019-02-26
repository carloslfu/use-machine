import { useState, useMemo, useEffect, useRef } from "react";
import {
  Machine,
  MachineConfig,
  EventObject,
  MachineOptions,
  OmniEvent,
  State,
  StateSchema,
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
): TCreateContext<TContext, TState, TEvent> {
  const machine = useMemo(
    () => Machine<TContext, TState, TEvent>(config, options, initialContext),
    []
  );

  const [state, setState] = useState<State<TContext, TEvent>>(
    machine.initialState
  );
  const [context, setContext] = useState<TContext>(machine.context!);

  const serviceRef = useRef<Interpreter<TContext, TState, TEvent>>(null);

  // Service is created lazily once
  function getService() {
    let service = serviceRef.current;
    if (service !== null) {
      return service;
    }
    let newService = interpret<TContext, TState, TEvent>(machine);
    // workaround https://github.com/DefinitelyTyped/DefinitelyTyped/issues/31065
    ;(serviceRef.current as any) = newService;
    newService.onTransition(state => setState(state as any));
    newService.onChange(context => setContext(context));
    // call init after the above callbacks are set so any immediate actions
    // are reflected in react's state
    newService.init();
    return newService;
  }

  // Stop the service when unmounting.
  useEffect(() => {
    return () => void getService().stop();
  }, []);

  return { state, send: getService().send, context, service: getService() };
}

export type TCreateContext<
  TContext,
  TState,
  TEvent extends EventObject
> = {
  state: State<TContext, TEvent>
  context: TContext
  send: TSendFn<TContext, TEvent>
  service: Interpreter<TContext, TState, TEvent>
}

type TSendFn<TContext, TEvent extends EventObject> = (
  event: OmniEvent<TEvent>
) => State<TContext, TEvent>;
