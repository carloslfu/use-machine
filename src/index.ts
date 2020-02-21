import { useState, useMemo, useEffect, useRef } from "react";
import {
  Machine,
  MachineConfig,
  EventObject,
  MachineOptions,
  OmniEvent,
  State,
  StateSchema,
  DefaultContext,
} from "xstate";
import { interpret, Interpreter } from "xstate/lib/interpreter";

export function useMachine<
  TStateSchema extends StateSchema,
  TEvent extends EventObject = EventObject,
  TContext = DefaultContext,
  >(
    config: MachineConfig<TContext, TStateSchema, TEvent>,
    options: Partial<MachineOptions<TContext, TEvent>>,
    initialContext?: TContext
  ): TCreateContext<TContext, TStateSchema, TEvent> {
  const machine = useMemo(
    () => Machine<TContext, TStateSchema, TEvent>(config, options, initialContext),
    []
  );

  const [state, setStateSchema] = useState<State<TContext, TEvent>>(
    machine.initialState
  );
  const [context, setContext] = useState<TContext>(machine.context!);

  const serviceRef = useRef<Interpreter<TContext, TStateSchema, TEvent> | null>(null);

  // Service is created lazily once
  function getService() {
    const service = serviceRef.current;
    if (service !== null) {
      return service;
    }
    const newService = interpret<TContext, TStateSchema, TEvent>(machine);
    serviceRef.current = newService;
    newService.onTransition(state => setStateSchema(state));
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
  TStateSchema,
  TEvent extends EventObject
  > = {
    state: State<TContext, TEvent>
    context: TContext
    send: TSendFn<TContext, TEvent>
    service: Interpreter<TContext, TStateSchema, TEvent>
  }

type TSendFn<TContext, TEvent extends EventObject> = (
  event: OmniEvent<TEvent>
) => State<TContext, TEvent>;
