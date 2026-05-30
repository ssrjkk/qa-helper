declare module 'sql.js' {
  export interface Database {
    run(sql: string, params?: (string | number | null)[]): void;
    exec(sql: string): { columns: string[]; values: (string | number | null)[][] }[];
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
  }

  export interface Statement {
    bind(params?: (string | number | null)[]): boolean;
    step(): boolean;
    get(): (string | number | null)[];
    getColumnNames(): string[];
    free(): boolean;
  }

  export interface SqlJsStatic {
    Database: new (data?: ArrayLike<number>) => Database;
  }

  export default function initSqlJs(config?: { locateFile?: (file: string) => string }): Promise<SqlJsStatic>;
}
