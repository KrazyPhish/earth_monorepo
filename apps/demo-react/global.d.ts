type Key = string | number | symbol

declare type Nullable<T> = T | null

declare type Undefinable<T> = T | undefined

declare type Inexistable<T> = T | null | undefined

declare type Arrayable<T> = T | T[]

declare type Promisable<T> = T | Promise<T>

declare type Recordable<K extends Key, T> = T | Record<K, T>

declare type ReadonlyRecord<K extends Key, T> = { readonly [key in K]: T }

declare type Writable<T> = { -readonly [K in keyof T]: T[K] }

declare type KV<K extends Key = string, V = string> = { key: K; value: V }

declare type Option<T = string> = { label: string; value: T }

declare type DeepPartial<T> = { [K in keyof T]?: DeepPartial<T[K]> }

declare type DeepRequired<T> = { [K in keyof T]-?: DeepRequired<T[K]> }

declare type PickRequired<T> = Exclude<keyof T, keyof Partial<T>>

declare type PickPartial<T> = Exclude<keyof T, keyof Required<T>>

declare type OmitPartial<T> = PickRequired<T>

declare type OmitRequired<T> = PickPartial<T>
