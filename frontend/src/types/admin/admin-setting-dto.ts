export type SettingDataType = 'String' | 'Integer' | 'Boolean' | 'Json' | 'DateTime' | number

export interface SelectSettingDTO {
  id: string
  key: string
  group: string
  value: string
  dataType: SettingDataType
  isSensitive: boolean
  description?: string | null
}

export interface CreateSettingDTO {
  key: string
  group: string
  value: string
  dataType: SettingDataType
  isSensitive: boolean
  description?: string | null
}

export interface UpdateSettingDTO extends CreateSettingDTO {
  id: string
}
