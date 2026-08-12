'use strict';
// ─────────────────────────────────────────────────────────────────────────────
// Dynamic multi-DB registry — nguồn cấu hình cho Phương án C.
//
// Đọc db-registry.json (mảng object), tạo 1 named oracledb pool / mỗi DB
// (poolAlias = key) lúc startup → "kết nối động": thêm DB = thêm 1 object,
// không sửa code. Cờ `cqn:true` đánh dấu DB cần CQN real-time (dùng ở bước
// tách worker sau; bước hiện tại CQN chỉ chạy trên primary).
//
// LƯU Ý thick mode: events-mode của OCI env do POOL ĐẦU TIÊN quyết định. Vì có
// DB cần CQN nên MỌI pool tạo với events:true → không lệ thuộc thứ tự tạo pool.
//
// Registry entry:
//   { key, user, password, connectString, cqn?, primary?,
//     poolMin?, poolMax?, poolIncrement? }
// ─────────────────────────────────────────────────────────────────────────────
const fs       = require('fs');
const path     = require('path');
const oracledb = require('oracledb');

const REGISTRY_PATH = process.env.DB_REGISTRY_PATH
    || path.join(__dirname, 'db-registry.json');

let _dbs        = [];        // entry[] đã validate
let _primaryKey = null;
const _ready    = new Set(); // key của pool tạo thành công (pool phụ lỗi vẫn cho server sống)

function loadRegistry() {
    let raw;
    try {
        raw = fs.readFileSync(REGISTRY_PATH, 'utf8');
    } catch (e) {
        throw new Error('Không đọc được ' + REGISTRY_PATH + ' — tạo từ db-registry.example.json. ' + e.message);
    }

    let arr;
    try { arr = JSON.parse(raw); }
    catch (e) { throw new Error('db-registry.json không phải JSON hợp lệ: ' + e.message); }

    if (!Array.isArray(arr) || arr.length === 0)
        throw new Error('db-registry.json phải là mảng có ít nhất 1 DB');

    const seen = new Set();
    _dbs = arr.map((d, i) => {
        for (const f of ['key', 'user', 'password', 'connectString']) {
            if (!d[f]) throw new Error('DB #' + i + ' thiếu trường "' + f + '"');
        }
        const key = String(d.key);
        if (seen.has(key)) throw new Error('Trùng key "' + key + '" trong registry');
        seen.add(key);
        return {
            key,
            user:          d.user,
            password:      d.password,
            connectString: d.connectString,
            cqn:           d.cqn === true,
            primary:       d.primary === true,
            // host: domain công khai mà request tới node mang trong header Host — dùng để
            // map request → dbKey khi client KHÔNG gửi db_key (vd broadcast-message). Bỏ port.
            host:          d.host ? String(d.host).toLowerCase().split(':')[0] : null,
            // pwaDbKey: khi gửi PWA cho notif của DB này, gọi package trên pool KHÁC
            // (vd package pkg_push_notification_pwa nằm ở apex_tnc, DBLINK sang tnc).
            pwaDbKey:      d.pwaDbKey ? String(d.pwaDbKey) : null,
            poolMin:       Number(d.poolMin)       || Number(process.env.DB_POOL_MIN)       || 2,
            poolMax:       Number(d.poolMax)       || Number(process.env.DB_POOL_MAX)       || 10,
            poolIncrement: Number(d.poolIncrement) || Number(process.env.DB_POOL_INCREMENT) || 1,
        };
    });

    const primaries = _dbs.filter(d => d.primary);
    if (primaries.length > 1)
        throw new Error('Chỉ được 1 DB có "primary": true (thấy ' + primaries.length + ')');
    _primaryKey = (primaries[0] || _dbs[0]).key;
    return _dbs;
}

// Tạo pool cho MỌI DB trong registry. Idempotent-ish: ném nếu poolAlias trùng
// (createPool sẽ báo) — gọi 1 lần lúc startup.
async function initPools() {
    if (!_dbs.length) loadRegistry();
    for (const d of _dbs) {
        try {
            await oracledb.createPool({
                poolAlias:     d.key,
                user:          d.user,
                password:      d.password,
                connectString: d.connectString,
                events:        true,   // xem ghi chú thick-mode ở đầu file
                poolMin:       d.poolMin,
                poolMax:       d.poolMax,
                poolIncrement: d.poolIncrement,
            });
            _ready.add(d.key);
            console.log('[DB] Pool "%s" → %s%s', d.key, d.connectString, d.cqn ? ' (CQN)' : '');
        } catch (err) {
            // Primary lỗi = fatal (core query/chat phụ thuộc). Pool phụ (apex_tnc cho PWA,
            // hoặc DB cqn thứ cấp) lỗi → cảnh báo + bỏ qua, KHÔNG sập server → notification/
            // chat vẫn sống. cqnDbs()/getConnection dựa _ready để không dùng pool hỏng.
            if (d.key === _primaryKey) {
                throw new Error('Pool primary "' + d.key + '" tạo thất bại: ' + err.message);
            }
            console.error('[DB] Pool "%s" tạo THẤT BẠI (bỏ qua, không fatal): %s', d.key, err.message);
        }
    }
    console.log('[DB] %d/%d pool(s) sẵn sàng. Primary=%s', _ready.size, _dbs.length, _primaryKey);
    return _dbs;
}

function primaryKey()        { return _primaryKey; }
function listDbs()           { return _dbs.slice(); }
function getDb(key)          { return _dbs.find(d => d.key === (key || _primaryKey)) || null; }
// Map header Host của request → dbKey (bỏ port, không phân biệt hoa/thường). null nếu không khớp.
function dbKeyByHost(host) {
    if (!host) return null;
    const h = String(host).toLowerCase().split(':')[0];
    const found = _dbs.find(d => d.host && d.host === h);
    return found ? found.key : null;
}
function isReady(key)        { return _ready.has(key || _primaryKey); }
// Chỉ CQN trên DB cqn:true CÓ pool sẵn sàng (pool hỏng → không subscribe).
function cqnDbs()            { return _dbs.filter(d => d.cqn && _ready.has(d.key)); }

// Lấy connection từ pool theo key (mặc định = primary). key là poolAlias.
function getConnection(key)  { return oracledb.getConnection(key || _primaryKey); }
function getPool(key)        { return oracledb.getPool(key || _primaryKey); }

async function closeAll(drainSeconds = 10) {
    for (const d of _dbs) {
        try { await oracledb.getPool(d.key).close(drainSeconds); }
        catch (_) { /* pool có thể chưa tạo */ }
    }
}

module.exports = {
    loadRegistry, initPools,
    primaryKey, listDbs, getDb, cqnDbs, isReady, dbKeyByHost,
    getConnection, getPool, closeAll,
};
