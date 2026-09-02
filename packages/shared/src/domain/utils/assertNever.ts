/**
 * Trợ thủ kiểm tra khớp mẫu toàn diện (Exhaustive Pattern Matching).
 * Nếu một nhánh giá trị nào trong Discriminated Union chưa được xử lý trong switch/case,
 * trình biên dịch TypeScript sẽ báo lỗi đỏ (Type Error) ngay lúc compile.
 */
export function assertNever(value: never, message?: string): never {
  throw new Error(message || `Chưa xử lý trường hợp: ${JSON.stringify(value)}`);
}
