/**
 * Tiện ích bảo mật và xử lý an toàn nội dung phía Client
 */

/**
 * Thoát các ký tự đặc biệt trong chuỗi để phòng chống tấn công XSS
 */
export function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Xóa bỏ hoàn toàn các thẻ HTML không an toàn khỏi chuỗi
 */
export function stripHtml(input: string): string {
  if (!input) return '';
  return input.replace(/<\/?[^>]+(>|$)/g, '');
}
