// Original file: packages/contracts/acoustic.proto

export const AcousticStatus = {
  ACOUSTIC_STATUS_UNSPECIFIED: 'ACOUSTIC_STATUS_UNSPECIFIED',
  ACOUSTIC_STATUS_NO_DATA: 'ACOUSTIC_STATUS_NO_DATA',
  ACOUSTIC_STATUS_QUIET: 'ACOUSTIC_STATUS_QUIET',
  ACOUSTIC_STATUS_MODERATE: 'ACOUSTIC_STATUS_MODERATE',
  ACOUSTIC_STATUS_LOUD: 'ACOUSTIC_STATUS_LOUD',
} as const;

export type AcousticStatus =
  | 'ACOUSTIC_STATUS_UNSPECIFIED'
  | 0
  | 'ACOUSTIC_STATUS_NO_DATA'
  | 1
  | 'ACOUSTIC_STATUS_QUIET'
  | 2
  | 'ACOUSTIC_STATUS_MODERATE'
  | 3
  | 'ACOUSTIC_STATUS_LOUD'
  | 4

export type AcousticStatus__Output = typeof AcousticStatus[keyof typeof AcousticStatus]
