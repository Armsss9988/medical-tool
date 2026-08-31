const fs = require('fs');

try {
  const inputRaw = fs.readFileSync(0, 'utf-8');
  
  const forbiddenPatterns = [
    /\bgit\s+push\b/i,
    /\bgit\s+clean\s+-f/i,
    /\brm\s+-rf\s+[\/\\]/i,
    /\bRemove-Item\s+.*-Recurse\s+.*-Force\s+[\/\\]/i
  ];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(inputRaw)) {
      console.log(JSON.stringify({
        decision: 'deny',
        reason: '[STRICT HARNESS] Thao tác này bị CHẶN TUYỆT ĐỐI theo quy định dự án (Không tự ý push code hoặc phá hủy dữ liệu).'
      }));
      process.exit(0);
    }
  }

  console.log(JSON.stringify({ decision: 'allow' }));
} catch (err) {
  console.log(JSON.stringify({ decision: 'allow' }));
}
