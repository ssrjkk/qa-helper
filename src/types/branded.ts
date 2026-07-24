declare const __brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [__brand]: B };

export type ProjectId = Brand<number, 'ProjectId'>;
export type TaskId = Brand<number, 'TaskId'>;
export type MemoryEntryId = Brand<number, 'MemoryEntryId'>;
export type ScreenshotId = Brand<number, 'ScreenshotId'>;
export type ConversationMessageId = Brand<number, 'ConversationMessageId'>;

export function projectId(id: number): ProjectId {
  return id as ProjectId;
}

export function taskId(id: number): TaskId {
  return id as TaskId;
}

export function memoryEntryId(id: number): MemoryEntryId {
  return id as MemoryEntryId;
}

export function screenshotId(id: number): ScreenshotId {
  return id as ScreenshotId;
}

export function conversationMessageId(id: number): ConversationMessageId {
  return id as ConversationMessageId;
}

export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

export function unwrap<T>(result: Result<T>): T {
  if (result.ok) return result.value;
  throw result.error;
}

export function unwrapOr<T>(result: Result<T>, defaultValue: T): T {
  return result.ok ? result.value : defaultValue;
}

export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok;
}

export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return !result.ok;
}

export async function tryCatch<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    return ok(await fn());
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
}

export function tryCatchSync<T>(fn: () => T): Result<T> {
  try {
    return ok(fn());
  } catch (e) {
    return err(e instanceof Error ? e : new Error(String(e)));
  }
}
