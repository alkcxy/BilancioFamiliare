import { useAuthStore } from '../stores/auth'
import { useOperationsStore } from '../stores/operations'
import type { CablePayload } from '../types'

// actioncable has no TS types
// eslint-disable-next-line @typescript-eslint/no-require-imports
const ActionCable = require('actioncable')

let consumer: ReturnType<typeof ActionCable.createConsumer> | null = null
let subscription: { unsubscribe: () => void } | null = null

export function connectCable() {
  const auth = useAuthStore()
  if (!auth.token) return

  if (consumer) {
    consumer.disconnect()
    consumer = null
    subscription = null
  }

  consumer = ActionCable.createConsumer()
  const ops = useOperationsStore()

  subscription = consumer.subscriptions.create(
    { channel: 'OperationChannel', token: auth.token },
    {
      connected() {},
      disconnected() { subscription = null },
      rejected() { subscription = null },
      received(data: CablePayload) {
        ops.applyUpdate(data)
      },
    },
  )
}

export function disconnectCable() {
  if (consumer) {
    consumer.disconnect()
    consumer = null
    subscription = null
  }
}
