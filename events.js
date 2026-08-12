'use strict';

const BUFFER_MAX = 100;
const BUFFER_TTL = 60_000;

// Định danh SSE namespace theo schema: mỗi schema Oracle có dãy aus_id riêng nên
// key phải là "<dbKey>:<ausId>" để user cùng aus_id ở 2 schema không đụng nhau.
const DEFAULT_DB_KEY = process.env.DEFAULT_DB_KEY || 'default';
const keyOf = (dbKey, ausId) => String(dbKey) + ':' + String(ausId);

// Event types được buffer để replay khi SSE reconnect
const BUFFERABLE = new Set(['message', 'read', 'notification']);

// "dbKey:aus_id" → res  (1 SSE conn/user; conn mới đẩy conn cũ ra)
const sseConnections = new Map();

// seq tăng dần — gắn vào mỗi SSE event để client dùng Last-Event-ID replay
let sseSeq = 0;

// "dbKey:aus_id" → [{ seq, payload, expiresAt }]
const eventBuffer = new Map();

function pruneBuffer(key) {
    const q = eventBuffer.get(key);
    if (!q) return null;
    const now   = Date.now();
    const fresh = q.filter(e => e.expiresAt > now);
    if (fresh.length) { eventBuffer.set(key, fresh); return fresh; }
    eventBuffer.delete(key);
    return null;
}

function bufferEvent(key, payload) {
    const seq = ++sseSeq;
    let q = eventBuffer.get(key) || [];
    // Gộp notification liên tiếp — chuông tự query lại DB nên 1 cái là đủ
    if (payload.type === 'notification' &&
        q.length && q[q.length - 1].payload.type === 'notification') {
        return seq;
    }
    q.push({ seq, payload, expiresAt: Date.now() + BUFFER_TTL });
    if (q.length > BUFFER_MAX) q = q.slice(q.length - BUFFER_MAX);
    eventBuffer.set(key, q);
    return seq;
}

function sseWrite(res, seq, payload) {
    try {
        res.write(`id: ${seq}\ndata: ${JSON.stringify(payload)}\n\n`);
    } catch (_) { /* conn đã đóng */ }
}

function registerSSE(dbKey, ausId, res, lastEventId) {
    const key = keyOf(dbKey, ausId);

    // Đẩy conn cũ ra
    const old = sseConnections.get(key);
    if (old) {
        console.log('[SSE] %s: conn cũ bị THAY THẾ bởi conn mới (tab reload / tab thứ 2?)', key);
        try { old.write('event: replaced\ndata: {}\n\n'); old.end(); } catch (_) {}
    }
    sseConnections.set(key, res);

    // Flush buffer từ lastEventId trở đi (replay sau reconnect).
    // Log số event replay: lastEventId=0 kèm replay>0 nghĩa là client mất seq
    // (worker mới tinh — page reload), chứ không phải nó đã nhận rồi bỏ qua.
    const since = Number(lastEventId) || 0;
    const q = pruneBuffer(key);
    if (q) {
        const pending = q.filter(e => e.seq > since);
        console.log('[SSE] %s: replay lastEventId=%s → %d/%d event trong buffer',
            key, since, pending.length, q.length);
        pending.forEach(e => sseWrite(res, e.seq, e.payload));
    }

    res.on('close', () => {
        if (sseConnections.get(key) === res) sseConnections.delete(key);
    });
}

function deliverToUser(dbKey, ausId, payload) {
    const key    = keyOf(dbKey, ausId);
    const sseRes = sseConnections.get(key);

    console.log('[Events] deliver key=%s type=%s → %s | conns=[%s]',
        key, payload.type, sseRes ? 'SSE-OPEN' : 'BUFFERED',
        [...sseConnections.keys()].join(', '));

    if (sseRes) {
        const seq = ++sseSeq;
        sseWrite(sseRes, seq, payload);
        // Buffer để replay khi reconnect
        if (BUFFERABLE.has(payload.type)) {
            let q = eventBuffer.get(key) || [];
            q.push({ seq, payload, expiresAt: Date.now() + BUFFER_TTL });
            if (q.length > BUFFER_MAX) q = q.slice(q.length - BUFFER_MAX);
            eventBuffer.set(key, q);
        }
        return;
    }

    // Không có SSE conn đang mở — buffer để replay khi client reconnect
    if (BUFFERABLE.has(payload.type)) bufferEvent(key, payload);
}

// dbKey optional để chữ ký startCQN(notifyUser) → _emitFn(ausId) 1 tham số không vỡ.
// TODO(worker-split): khi tách CQN worker/instance, worker phải truyền dbKey thật.
function notifyUser(ausId, dbKey = DEFAULT_DB_KEY) {
    deliverToUser(dbKey, String(ausId), { type: 'notification' });
    console.log('[Events] notification → %s:%s', dbKey, ausId);
}

// MỌI dbKey mà aus_id này đang có SSE conn (key = "<dbKey>:<ausId>").
// Trả về MẢNG chứ không phải 1 giá trị: cùng 1 aus_id có thể mở app ở nhiều schema
// cùng lúc (vd 260504 vừa mở dev24 vừa mở tnc) — chọn bừa cái đầu tiên là đoán sai.
// Caller dùng danh sách này làm ỨNG VIÊN rồi probe DB để chốt schema đúng.
function dbKeysForAusId(ausId) {
    const suffix = ':' + String(ausId);
    const keys = [];
    for (const key of sseConnections.keys()) {
        if (key.endsWith(suffix)) keys.push(key.slice(0, -suffix.length));
    }
    return keys;
}

function drainAll() {
    for (const [, res] of sseConnections) {
        try { res.write('event: close\ndata: {}\n\n'); res.end(); } catch (_) {}
    }
    sseConnections.clear();
}

module.exports = { deliverToUser, notifyUser, drainAll, registerSSE, dbKeysForAusId };
