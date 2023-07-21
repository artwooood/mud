import { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import { inArray } from "drizzle-orm";
import { Table } from "../common";
import { TableId } from "@latticexyz/common";
import { getTableName } from "./getTableName";
import { mudStoreTables } from "./internalTables";

export function getTables(
  db: BaseSQLiteDatabase<"sync", void>,
  conditions: Pick<Table, "address" | "namespace" | "name">[] = []
): Table[] {
  const ids = Array.from(
    new Set(conditions.map((condition) => getTableName(condition.address, condition.namespace, condition.name)))
  );
  const tables = db
    .select()
    .from(mudStoreTables)
    .where(ids.length ? inArray(mudStoreTables.id, ids) : undefined)
    .all();

  return tables.map((table) => {
    const tableId = new TableId(table.namespace, table.name).toHex();
    return {
      id: getTableName(table.address, table.namespace, table.name),
      address: table.address,
      tableId,
      namespace: table.namespace,
      name: table.name,
      keySchema: table.keySchema,
      valueSchema: table.valueSchema,
      lastUpdatedBlockNumber: table.lastUpdatedBlockNumber,
    };
  });
}
