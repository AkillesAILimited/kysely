import { AliasedRawBuilder, RawBuilder } from '../raw-builder/raw-builder.js'
import {
  AliasedQueryBuilder,
  QueryBuilder,
} from '../query-builder/query-builder.js'
import { ExpressionBuilder } from '../query-builder/expression-builder.js'

/**
 * Given an object type, extracts the union of all value types.
 */
export type ValueType<T> = T[keyof T]

/**
 * Given a database type and a union of table names returns the row type
 * that you would get by selecting all columns from tables TB.
 *
 * Example:
 *
 * ```ts
 * interface Person {
 *   id: number
 * }
 *
 * interface Pet {
 *   name: string
 *   species: 'cat' | 'dog'
 * }
 *
 * interface Movie {
 *   stars: number
 * }
 *
 * interface Database {
 *   person: Person
 *   pet: Pet
 *   movie: Movie
 * }
 *
 * type Row = RowType<Database, 'person' | 'movie'>
 *
 * // Row == Person & Movie
 * ```
 */
export type RowType<DB, TB extends keyof DB> = UnionToIntersection<DB[TB]>

/**
 * Evil typescript magic to convert a union type `A | B | C` into an
 * intersection type `A & B & C`.
 */
type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends (
  k: infer I
) => void
  ? I
  : never

/**
 * Given a database type and a union of table names in that db, returns
 * a union type with all possible column names.
 *
 * Example:
 *
 * ```ts
 * interface Person {
 *   id: number
 * }
 *
 * interface Pet {
 *   name: string
 *   species: 'cat' | 'dog'
 * }
 *
 * interface Movie {
 *   stars: number
 * }
 *
 * interface Database {
 *   person: Person
 *   pet: Pet
 *   movie: Movie
 * }
 *
 * type Columns = AnyColumn<Database, 'person' | 'pet'>
 *
 * // Columns == 'id' | 'name' | 'species'
 * ```
 */
export type AnyColumn<DB, TB extends keyof DB> = {
  [T in TB]: keyof DB[T]
}[TB]

/**
 * Given a database type and a union of table names in that db, returns
 * a union type with all possible `table`.`column` combinations.
 *
 * Example:
 *
 * ```ts
 * interface Person {
 *   id: number
 * }
 *
 * interface Pet {
 *   name: string
 *   species: 'cat' | 'dog'
 * }
 *
 * interface Movie {
 *   stars: number
 * }
 *
 * interface Database {
 *   person: Person
 *   pet: Pet
 *   movie: Movie
 * }
 *
 * type Columns = AnyColumn<Database, 'person' | 'pet'>
 *
 * // Columns == 'person.id' | 'pet.name' | 'pet.species'
 * ```
 */
export type AnyColumnWithTable<DB, TB extends keyof DB> = {
  [T in TB]: T extends string
    ? keyof DB[T] extends string
      ? `${T}.${keyof DB[T]}`
      : never
    : never
}[TB]

/**
 * Just like {@link AnyColumn} but with a ` as <string>` suffix.
 */
export type AnyAliasedColumn<DB, TB extends keyof DB> = {
  [T in TB]: T extends string
    ? keyof DB[T] extends string
      ? `${keyof DB[T]} as ${string}`
      : never
    : never
}[TB]

/**
 * Just like {@link AnyColumnWithTable} but with a ` as <string>` suffix.
 */
export type AnyAliasedColumnWithTable<DB, TB extends keyof DB> = {
  [T in TB]: T extends string
    ? keyof DB[T] extends string
      ? `${T}.${keyof DB[T]} as ${string}`
      : never
    : never
}[TB]

/**
 * Extracts the item type of an array.
 */
export type ArrayItemType<T> = T extends ReadonlyArray<infer I> ? I : never

export type AnyQueryBuilder = QueryBuilder<any, any, any>
export type AnyAliasedQueryBuilder = AliasedQueryBuilder<any, any, any, any>

export type AnyRawBuilder = RawBuilder<any>
export type AnyAliasedRawBuilder = AliasedRawBuilder<any, any>

export type QueryBuilderFactory<DB, TB extends keyof DB> = (
  qb: ExpressionBuilder<DB, TB>
) => QueryBuilder<any, any, any>

export type AliasedQueryBuilderFactory<DB, TB extends keyof DB> = (
  qb: ExpressionBuilder<DB, TB>
) => AnyAliasedQueryBuilder

export type RawBuilderFactory<DB, TB extends keyof DB> = (
  qb: ExpressionBuilder<DB, TB>
) => AnyRawBuilder

export type AliasedRawBuilderFactory<DB, TB extends keyof DB> = (
  qb: ExpressionBuilder<DB, TB>
) => AnyAliasedRawBuilder

export interface InsertResultTypeTag {
  /** @internal */
  readonly __isInsertResultTypeTag__: true
}

export interface DeleteResultTypeTag {
  /** @internal */
  readonly __isDeleteResultTypeTag__: true
}

export interface UpdateResultTypeTag {
  /** @internal */
  readonly __isUpdateResultTypeTag__: true
}

export interface GeneratedPlaceholder {
  /** @internal */
  readonly __isGeneratedPlaceholder__: true
}

export type ManyResultRowType<O> = O extends InsertResultTypeTag
  ? number | undefined
  : O extends DeleteResultTypeTag
  ? number
  : O extends UpdateResultTypeTag
  ? number
  : O

export type SingleResultRowType<O> = O extends InsertResultTypeTag
  ? number | undefined
  : O extends DeleteResultTypeTag
  ? number
  : O extends UpdateResultTypeTag
  ? number
  : O | undefined

export type NonEmptySingleResultRowType<O> = O extends InsertResultTypeTag
  ? number
  : O extends DeleteResultTypeTag
  ? number
  : O extends UpdateResultTypeTag
  ? number
  : O

export type UnknownRow = Record<string, unknown>

export type Nullable<T> = { [P in keyof T]: T[P] | null }
