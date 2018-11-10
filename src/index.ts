import { useState, useEffect, useMemo } from 'react'
import { Machine, MachineConfig, EventObject, MachineOptions } from 'xstate'
import { interpret } from 'xstate/lib/interpreter'

export function useMachine<
  ContextType = any,
  StateType = any,
  EventType extends EventObject = any
>(
  config: MachineConfig<ContextType, StateType, EventType>,
  options: MachineOptions<ContextType, EventType>,
  initialContext: ContextType
) {
  const machine = useMemo(() => Machine(config, options, initialContext));
  const [state, setState] = useState(machine.initialState)
  const [exState, setExState] = useState(machine.context)
  const [send, setSend] = useState()
  const [service, setService] = useState()
  useEffect(() => {
    const service = interpret(machine)
    setService(service)
    service.start()
    service.onTransition(setState)
    service.onChange(setExState)
    setSend(() => service.send)
    return () => {
      service.off(setState)
      service.off(setExState)
    }
  }, [])
  return { state, send, exState, service }
}
