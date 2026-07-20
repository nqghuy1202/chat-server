'use strict';

const crypto   = require('crypto');
const registry = require('./db-registry');

const SECRET = process.env.G_SSE_SECRET || process.env.SSE_SECRET || '';

// dbKey namespaces identity per Oracle schema (aus_id sequences are per-schema).
// Token cũ 2 phần (aus_id|exp) map về schema PRIMARY (nguồn sự thật = "primary":true
// trong db-registry.json) để khớp namespace mà chat.js deliverToConv dùng (primaryKey())
// → chat không vỡ khi app chưa set G_DB_KEY. Không hardcode qua .env (tránh trùng lặp).
// '|| default' chỉ là chốt phòng khi pool chưa init (không xảy ra ở runtime verify).
const defaultDbKey = () => registry.primaryKey() || 'default';

// token = base64url("<dbKey>|<aus_id>|<exp_epoch_seconds>") + "." + base64url(HMAC_SHA256(body, SECRET))
// Tương thích ngược: body 2 phần "<aus_id>|<exp>" → dbKey = DEFAULT_DB_KEY.
function verifyToken(token) {
    if (!token || !SECRET) return null;

    const dot = token.lastIndexOf('.');
    if (dot < 1) return null;

    const body = token.slice(0, dot);
    const sig  = token.slice(dot + 1);

    const expected = crypto
        .createHmac('sha256', SECRET)
        .update(body)
        .digest('base64url');

    // timing-safe compare
    let safeLen = Math.max(sig.length, expected.length);
    const a = Buffer.alloc(safeLen).fill(0);
    const b = Buffer.alloc(safeLen).fill(0);
    Buffer.from(sig).copy(a);
    Buffer.from(expected).copy(b);
    if (!crypto.timingSafeEqual(a, b)) return null;

    let decoded;
    try { decoded = Buffer.from(body, 'base64url').toString(); }
    catch { return null; }

    const parts = decoded.split('|');
    let dbKey, ausIdStr, expStr;
    if (parts.length === 3) {
        [dbKey, ausIdStr, expStr] = parts;
    } else if (parts.length === 2) {
        [ausIdStr, expStr] = parts;
        dbKey = defaultDbKey();
    } else {
        return null;
    }
    if (!dbKey || !ausIdStr || !expStr) return null;

    const exp   = Number(expStr);
    const ausId = Number(ausIdStr);
    if (!Number.isFinite(exp) || !Number.isFinite(ausId)) return null;
    if (Date.now() / 1000 > exp) return null;

    return { dbKey, ausId };
}

module.exports = { verifyToken };
