const { execSync } = require('child_process');
const path = require('path');

try {
  // Chạy typecheck ở thư mục gốc của repo
  const repoRoot = path.resolve(__dirname, '../../');
  execSync('npm run typecheck', {
    cwd: repoRoot,
    stdio: 'pipe',
    timeout: 30000
  });

  // Nếu typecheck thành công (exit 0) -> cho phép Agent dừng lại
  console.log(JSON.stringify({}));
} catch (err) {
  const stdout = err.stdout ? err.stdout.toString('utf-8') : '';
  const stderr = err.stderr ? err.stderr.toString('utf-8') : '';
  const errorMsg = (stdout + '\n' + stderr).trim().slice(-1500); // Lấy 1500 ký tự cuối của lỗi

  // Bắt buộc Agent tiếp tục sửa lỗi, không cho dừng!
  console.log(JSON.stringify({
    decision: 'continue',
    reason: `[STRICT HARNESS ENFORCEMENT] Dự án còn lỗi TypeScript. Bạn KHÔNG ĐƯỢC DỪNG cho đến khi sửa hết toàn bộ lỗi này:\n\n${errorMsg}`
  }));
}
