// @flow
import type { session } from './session'

export type idp =
  { displayName: string
  , url: string
  , iconUrl: string
  }

export const defaultIdps: idp[] =
  [ { displayName: 'Solid Test Space'
    , url: 'https://solidtest.space/'
    , iconUrl: 'https://solidtest.space/favicon.ico'
    }
  ]
