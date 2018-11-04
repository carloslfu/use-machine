import { useState, useEffect } from 'react'
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
  const machine = Machine(config, options, initialContext)
  const [state, setState] = useState(machine.initialState)
  const [exState, setExState] = useState(machine.context)
  const [send, setSend] = useState()
  useEffect(() => {
    const interpreter = interpret(machine)
    interpreter.init()
    interpreter.onTransition(setState)
    interpreter.onChange(setExState)
    setSend(() => interpreter.send)
    return () => {
      interpreter.off(setState)
      interpreter.off(setExState)
    }
  }, [])
  return { state, send, exState }
}
