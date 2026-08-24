export function withTimeout(promise, ms = 10000, message = '요청이 너무 오래 걸립니다. 네트워크 또는 Supabase 설정을 확인해주세요.') {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms)),
  ])
}
