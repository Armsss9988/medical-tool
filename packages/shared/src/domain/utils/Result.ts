/**
 * Pure Functional Result Pattern Wrapper for GoLab Domain.
 * Tuân thủ quy chuẩn Domain DDD: Tránh throw Exception cho luồng nghiệp vụ thông thường.
 */
export type Result<T, E = string> =
  | { readonly ok: true; readonly value: T; readonly error?: never }
  | { readonly ok: false; readonly error: E; readonly value?: never };

export const Result = {
  ok<T>(value: T): Result<T, never> {
    return { ok: true, value };
  },
  fail<E = string>(error: E): Result<never, E> {
    return { ok: false, error };
  }
};
