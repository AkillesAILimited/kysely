[![Discord](https://img.shields.io/discord/890118421587578920)](https://discord.gg/C9aJ49mCra)
[![Tests](https://github.com/koskimas/kysely/actions/workflows/test.yml/badge.svg)](https://github.com/koskimas/kysely)

# [Kysely](https://koskimas.github.io/kysely/index.html)

A type-safe and autocompletion-friendly typescript SQL query builder for node.js. Inspired by
[knex](http://knexjs.org/). [Here's](https://www.jakso.me/blog/kysely-a-type-safe-sql-query-builder-for-typescript)
an introductory blog post for you.

![](https://github.com/koskimas/kysely/blob/master/assets/demo.gif)

Kysely's typings make sure you only refer to tables and columns that are visible to the part of the query
you are writing. The result type only has the selected columns with correct types and aliases. This 
allows tools like vscode autocompletion to make your life so much easier.

As you can see in the gif above, through the pure magic of modern typescript, Kysely is even able to parse
the alias given to `pet.name` and add the `pet_name` column to the result row type. Kysely is able to infer
column names, aliases and types from selected subqueries, joined subqueries, `with` statements and pretty
much anything you can think of. Typescript is always there for you offering completions and making sure
you build a valid query.

Of course there are cases where things cannot be typed at compile time, and Kysely offers escape
hatches for these situations. With typescript you can always cast something to `any` if the types
fail you. With Kysely you can also explicitly tell it to ignore the typings, but the default is always
type-safety! See the [DynamicModule](https://koskimas.github.io/kysely/classes/DynamicModule.html#ref)
for more info.

Kysely is still young and some useful features are propably not yet implemented. If you start
using Kysely and can't find something you'd want to use, please open an issue or join our
[discord server](https://discord.gg/C9aJ49mCra).

# Table of contents

- [Installation](#installation)
- [Minimal example](#minimal-example)
- [Query examples](#query-examples)
- [Migrations](#migrations)
- [API reference](https://koskimas.github.io/kysely/index.html)

# Installation

Kysely currently works on PostgreSQL and MySQL. You can install it using

```
# postgres
npm install kysely pg

# mysql
npm install kysely mysql2
```

More dialects will be added soon. Kysely also has a simple interface
for [3rd party dialects](https://koskimas.github.io/kysely/interfaces/Dialect.html).

### 3rd party dialects:

 - [AWS Data API](https://github.com/serverless-stack/kysely-data-api)

# Minimal example

All you need to do is define an interface for each table in the database and pass those
interfaces to the `Kysely` constructor:

```ts
import { Kysely, PostgresDialect } from 'kysely'

interface Person {
  id: number
  first_name: string
  // If the column is nullable in the db, make its type nullable.
  // Don't use optional properties.
  last_name: string | null
  gender: 'male' | 'female' | 'other'
}

interface Pet {
  id: number
  name: string
  owner_id: number
  species: 'dog' | 'cat'
}

interface Movie {
  id: string
  stars: number
}

// Keys of this interface are table names.
interface Database {
  person: Person
  pet: Pet
  movie: Movie
}

// You'd create one of these when you start your app.
const db = new Kysely<Database>({
  dialect: new PostgresDialect({
    host: 'localhost',
    database: 'kysely_test',
  })
})

async function demo() {
  const person = await db
    .selectFrom('person')
    .innerJoin('pet', 'pet.owner_id', 'person.id')
    .select(['first_name', 'pet.name as pet_name'])
    .where('person.id', '=', 1)
    .executeTakeFirst()

  if (person) {
    person.pet_name
  }
}
```

# Query examples

## Select queries

You can find examples of select queries in the documentation of the 
[select method](https://koskimas.github.io/kysely/classes/QueryBuilder.html#select) and
the [where method](https://koskimas.github.io/kysely/classes/QueryBuilder.html#where) 
among other places.

## Update queries

See the [set method](https://koskimas.github.io/kysely/classes/QueryBuilder.html#set) and the
[updateTable method](https://koskimas.github.io/kysely/classes/Kysely.html#updateTable)
documentation.

## Insert queries

See the [values method](https://koskimas.github.io/kysely/classes/QueryBuilder.html#values) and the
[insertInto method](https://koskimas.github.io/kysely/classes/Kysely.html#insertInto)
documentation.

## Delete queries

See the [deleteFrom method](https://koskimas.github.io/kysely/classes/Kysely.html#deleteFrom)
documentation.

# Migrations

Migration files should look like this:

```ts
import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  // Migration code
}

export async function down(db: Kysely<any>): Promise<void> {
  // Migration code
}
```

The `up` function is called when you update your database schema to next version and `down`
when you go back to previous version. The only argument to the functions is an instance of
`Kysely<any>`. It is important to use `Kysely<any>` and not `Kysely<YourDatabase>`. Migrations
should never depend on the current code of your app because they need to work even if the app
changes completely. Migrations need to be "frozen in time".

The migrations can use the [Kysely.schema](https://koskimas.github.io/kysely/classes/SchemaModule.html)
module to modify the schema. Migrations can also run normal queries to modify the data.

### PostgreSQL migration example

```ts
import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('person')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('first_name', 'varchar', (col) => col.notNull())
    .addColumn('last_name', 'varchar')
    .addColumn('gender', 'varchar(50)', (col) => col.notNull())
    .execute()

  await db.schema
    .createTable('pet')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('name', 'varchar', (col) => col.notNull().unique())
    .addColumn('owner_id', 'integer', (col) =>
      col.references('person.id').onDelete('cascade').notNull()
    )
    .addColumn('species', 'varchar', (col) => col.notNull())
    .execute()

  await db.schema
    .createIndex('pet_owner_id_index')
    .on('pet')
    .column('owner_id')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('pet').execute()
  await db.schema.dropTable('person').execute()
}
```

### MySQL migration example

```ts
import { Kysely } from 'kysely'

export async function up(db: Kysely<any>): Promise<void> {
  await db.schema
    .createTable('person')
    .addColumn('id', 'integer', (col) => col.autoIncrement().primaryKey())
    .addColumn('first_name', 'varchar(255)', (col) => col.notNull())
    .addColumn('last_name', 'varchar(255)')
    .addColumn('gender', 'varchar(50)', (col) => col.notNull())
    .execute()

  await db.schema
    .createTable('pet')
    .addColumn('id', 'integer', (col) => col.autoIncrement().primaryKey())
    .addColumn('name', 'varchar(255)', (col) => col.notNull().unique())
    .addColumn('owner_id', 'integer', (col) => col.notNull())
    .addColumn('species', 'varchar(255)', (col) => col.notNull())
    .addForeignKeyConstraint(
      'pet_owner_id_fk', ['owner_id'], 'person', ['id'],
      (cb) => cb.onDelete('cascade')
    )
    .execute()

  await db.schema
    .createIndex('pet_owner_id_index')
    .on('pet')
    .column('owner_id')
    .execute()
}

export async function down(db: Kysely<any>): Promise<void> {
  await db.schema.dropTable('pet').execute()
  await db.schema.dropTable('person').execute()
}
```

You can then use

```ts
await db.migration.migrateToLatest(pathToMigrationsFolder)
```

to run all migrations that have not yet been run. The migrations are executed in alphabetical
order by their file name.

Kysely doesn't have a CLI for running migrations and probably never will. This is because Kysely's
migrations are also written in typescript. To run the migrations, you need to first build the
typescript code into javascript. The CLI would cause confusion over which migrations are being
run, the typescript ones or the javascript ones. If we added support for both, it would mean the
CLI would depend on a typescript compiler, which most production environments don't (and shouldn't)
have. You will probably want to add a simple migration script to your projects like this:

```ts
import path from 'path'
import { db } from './database'

db.migration
  .migrateToLatest(path.join(__dirname, 'migrations'))
  .then(() => db.destroy())
```

The migration methods use a lock on the database level, and parallel calls are executed serially.
This means that you can safely call `migrateToLatest` and other migration methods from multiple
server instances simultaneously and the migrations are guaranteed to only be executed once.

NOTE: Only `db.migration.migrateToLatest` method is implemented at the moment. There is no way
to run the down migrations, or to go forward to a specific migration. These methods will be
added soon.

# Why not just contribute to knex

Kysely is very similar to knex, but it also attempts to fix things that I personally find not-so-good
in knex. Bringing the type system and the changes to knex would mean very significant breaking changes
that aren't possible at this point of the project. Knex was also originally written for javascript and
the typescript typings were added afterwards. That always leads to compromises in the types. Designing
a library for typescript from the ground up produces much better and simpler types.
