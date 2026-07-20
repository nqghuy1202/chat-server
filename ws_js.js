let g$ = document.querySelector.bind(document), g$$ = document.querySelectorAll.bind(document);

apex.theme42.util.configAPEXMsgs({
    autoDismiss: true,
    duration: 3000
})

function gSetFooter(groupUser, version, compayName) {
    let fCustomize = g$('.t-Footer-customize'),
        fCopyright = g$('.t-Footer-version')
    !!fCustomize && (fCustomize.innerHTML = groupUser)
    !!fCopyright && (fCopyright.innerHTML = version + ' ' + compayName)
}

function gSetLogoHeader(workspaceId) {
    let logoImg = g$('.apex-logo-img'),
        logoIcon = g$('.t-Login-GreenSys .t-Login-logo'),
        bgSection = g$('.t-Login-GreenSys .t-Login-subsection'),
        bgImage = g$('.t-Login-GreenSys')
    !!logoImg && !logoImg.getAttribute('src') && (logoImg.src = `/i/GreenSys/${workspaceId}/Logo/GreenSysLogo.png`)
    !!logoIcon && (logoIcon.style.background = `transparent url("/i/GreenSys/${workspaceId}/Logo/login_logo_v2.png") no-repeat center`)
    !!bgSection && (bgSection.style.backgroundImage = `url("/i/GreenSys/${workspaceId}/Logo/login_background_sub_v2.png")`)
    !!bgImage && (bgImage.style.backgroundImage = `url("/i/GreenSys/${workspaceId}/Logo/login_background_v2.png")`)
}

function gInitDropDown() {
    let blurId

    function hideMenu(element, ms) {
        return setTimeout(function () {
            element.style.display = 'none'
        }, ms)
    }

    return apex.server.process(
        'init_action',
        {
            pageItems: `#P${pageId}_MEN_ID`
        },
        {
            dataType: 'html',
            success: pData => pData
        }
    ).then(result => {
        let action = g$('body')
        if (action) {
            let wrapper = document.createElement('div')
            wrapper.innerHTML = result
            wrapper.classList.add('dropdown-wrapper')
            action.appendChild(wrapper)

            g$('#Btn_Action').onmouseenter = function (e) {
                clearTimeout(blurId)
                blurId = null
                let { x, y, width, height } = g$('#Btn_Action').getBoundingClientRect()
                wrapper.style.display = 'block'
                wrapper.style.top = `${y + height + 4}px`
                wrapper.style.right = `calc(100vw - ${x + width}px - 0.5rem)`
            }

            g$('#Btn_Action').onmouseleave = function (e) {
                blurId = hideMenu(wrapper, 400)
            }

            g$('.dropdown-wrapper').onmouseenter = function (e) {
                clearTimeout(blurId)
                blurId = null
            }

            g$('.dropdown-wrapper').onmouseleave = function (e) {
                blurId = hideMenu(wrapper, 400)
            }

            g$$('.dropdown-item').forEach(r => {
                r.onclick = function () {
                    hideMenu(wrapper, 0)
                }
            })
        }
    })
}

function gFirstChar(str) {
    if (str.indexOf('\n') !== -1) {
        str = str.slice(str, str.indexOf('\n'))
    }
    return str.replace(/(?:^|\s)\S/g, char => {
        return char.toUpperCase()
    })
}

function gConvertDate(dateStr) {
    if (!dateStr) return true
    let regex = /^(\d{2})-(\d{2})-(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?$/;
    let match = dateStr.match(regex);
    if (!match) {
        return false
    }
    // let [, day, month, year, hour = '0', minute = '0', second = '0'] = match;
    let day = match[1];
    let month = match[2];
    let year = match[3];
    let hour = match[4] || '0';
    let minute = match[5] || '0';
    let second = match[6] || '0';
    let date = new Date(year, month - 1, day, hour, minute, second);
    if (
        date.getFullYear() !== Number(year) ||
        date.getMonth() !== Number(month) - 1 ||
        date.getDate() !== Number(day) ||
        date.getHours() !== Number(hour) ||
        date.getMinutes() !== Number(minute) ||
        date.getSeconds() !== Number(second)
    ) {
        return false
    }
    return date;
}

async function gCheckDate(id) {
    let arr = document.querySelectorAll(`#${id} input.apex-item-datepicker:not(.apex_disabled):not([id$="_HIDDENVALUE"])`)
    let mess = await gGetMess(982)
    let checked = true
    return new Promise((res, rej) => {
        arr.forEach(e => {
            let id = e.name
            let obj = gConvertDate($v(id), true)
            if (!obj) {
                apex.message.showErrors({
                    type: 'error',
                    location: ['page', 'inline'],
                    pageItem: id,
                    message: mess + ' ' + gFirstChar(document.querySelector(`#${id}_LABEL`).innerText),
                    unsafe: false
                });
                checked = false
            }
        })
        res(checked)
    })
}

function gGetMess(code) {
    return apex.server.process(
        'globalGetMess',
        {
            x01: code
        },
        {
            dataType: 'text',
            success: pData => pData
        }
    )
}

function gGreenSysMessage(e, code) {
    if ("success" == e || "warning" == e || "error" == e) {
        var n, i, r;
        apex.server.process(
            'globalGetMess',
            {
                x01: code
            },
            {
                dataType: 'text',
                success: pData => {
                    switch (e) {
                        case "success":
                            i = "t-Alert--success",
                                r = "t-Icon";
                            break;
                        case "warning":
                            i = "t-Alert--warning1",
                                r = "fa fa-exclamation-triangle t-MessageIcon";
                            break;
                        case "error":
                            i = "t-Alert--error",
                                r = "fa fa-times-circle t-MessageIcon"
                    }
                    var a = '\n<div class="t-Body-alert">\n  <div class="t-Alert t-Alert--defaultIcons ' + i + ' t-Alert--horizontal t-Alert--page t-Alert--colorBG" id="t_Alert_Success" role="alert">\n    <div class="t-Alert-wrap">\n      <div class="t-Alert-icon">\n        <span class="' + r + '"></span>\n      </div>\n      <div class="t-Alert-content">\n        <div class="t-Alert-header">\n          <h2 class="t-Alert-title">' + pData + '</h2>\n        </div>\n      </div>\n      <div class="t-Alert-buttons">\n        <button class="t-Button t-Button--noUI t-Button--icon t-Button--closeAlert" type="button" title="' + n + '"><span class="t-Icon icon-close"></span></button>\n      </div>\n    </div>\n  </div>\n</div>'
                        , o = document.getElementById("APEX_SUCCESS_MESSAGE");
                    o.classList.remove("u-hidden"),
                        o.classList.add("u-visible"),
                        o.innerHTML = a,
                        setTimeout((function () {
                            $("#t_Alert_Success").fadeOut("slow")
                        }
                        ), 5e3)
                }
            }
        )
    }
}

const gMoveIGActionToBreadcrumb = (id) => {
    let b = $('#t_Body_title .t-BreadcrumbRegion-buttons.t-BreadcrumbRegion-buttons--end')
    let a = $(`#${id}_ig_toolbar_actions_button`).detach()
    let h = $(`#${id}_ig .a-IG-header`)
    if (!!b && !!a) {
        b.append(a)
        a.css('margin-left', '0.375rem')
        h.css('display', 'none');
    }
}

const gMoveIGActionToHeader = (id, idTo = id) => {
    let b = $(`#${idTo}>>.t-Region-headerItems.t-Region-headerItems--buttons`)
    let a = $(`#${id}_ig_toolbar_actions_button`).detach()
    let h = $(`#${id}_ig .a-IG-header`)
    if (!!b && !!a) {
        let m = b.find('span.js-maximizeButtonContainer')
        if (m.length) {
            a.insertBefore(m)
            a.css('margin-left', '0.375rem')
        } else {
            b.append(a)
        }
        h.css('display', 'none')
    }
};

// (function ($) {
//     $(apex.gPageContext$).on('apexreadyend', function (e) {
//         let bTitle = g$('.t-BreadcrumbRegion-title')
//         !!bTitle && (g$(`.${bTitle.className} .t-BreadcrumbRegion-titleText`).innerText = document.title)
//     })
// })(apex.jQuery);

const gShortCuts = (btnNew, btnSave, btnCom, btnAdd, scope = 'page') => {
    const isMac = /Mac/.test(navigator.platform);
    const shortcuts = {
        'keya': btnNew,
        'keyc': btnCom,
        'keys': btnSave,
        'enter': btnAdd
    };
    const handleButtonClick = (btnId) => {
        const btn = document.getElementById(btnId);
        if (!btn || window.getComputedStyle(btn).display === 'none' || btn.disabled) return;
        const activeEl = document.activeElement;
        if (isMac && /^(INPUT|TEXTAREA)$/i.test(activeEl.tagName)) {
            activeEl.dispatchEvent(new CompositionEvent('compositionend'));
            activeEl.dispatchEvent(new InputEvent('input', { bubbles: true }));
            activeEl.dispatchEvent(new Event('change', { bubbles: true }));
            requestAnimationFrame(() => {
                btn.focus();
            });
        } else {
            btn.focus();
        }
        btn.click();
    };
    document.addEventListener('keydown', (e) => {
        const isDialogOpen = $('.ui-dialog:visible').length > 0;
        if (isDialogOpen && scope === 'page') {
            return;
        }
        const key = e.code.toLowerCase();
        let matchedKey = null;
        if (e.ctrlKey && e.altKey && (key === 'keya' || key === 'keyc')) {
            matchedKey = key;
        } else if (e.ctrlKey && (key === 'keys' || key === 'enter')) {
            matchedKey = key;
        }
        if (matchedKey) {
            e.preventDefault();
            const btnId = shortcuts[matchedKey];
            if (btnId) handleButtonClick(btnId);
        }
    });
};

const globalMoveItemsToIG = (regionStaticId, items = []) => {

    const region = $(`#${regionStaticId}`);
    if (!region.length) return;

    // ✅ lấy đúng group (không phải container)
    const group = region.find('.a-Toolbar-groupContainer--end .a-Toolbar-group').first();
    if (!group.length) return;

    items.forEach(id => {
        const el = $(`#${id}`);
        if (!el.length) return;

        const elDom = el[0];
        const groupDom = group[0];

        // tránh loop DOM
        if (elDom.contains(groupDom)) return;

        // tránh duplicate
        if (group.find(`#${id}`).length) return;

        // ✅ style chuẩn IG
        el.addClass('a-Button a-Toolbar-item');

        group.append(el.detach());
    });
};

// (function () {
//     'use strict';
//     if (window._eventsPoll) return;
//     if (window.parent && window.parent !== window) return;

//     // ── Helpers: login + worker URL (tự dò, KHÔNG cần set ở Page 0) ────────────

//     // Đăng nhập? Ưu tiên window.IS_AUTHENTICATED (set Page 0 FGVD bằng '&APP_USER.').
//     // Fallback: phần tử nav chuông '.user-notificaiton' chỉ render khi đã login.
//     // function isAuthenticated() {
//     //     if (typeof window.IS_AUTHENTICATED === 'boolean') return window.IS_AUTHENTICATED;
//     //     return document.querySelector('.user-notificaiton') != null;
//     // }

//     function isAuthenticated() {
//         // if (typeof window.IS_AUTHENTICATED === 'boolean') return window.IS_AUTHENTICATED; // vẫn ưu tiên nếu có
//         // Marker chỉ xuất hiện khi đã đăng nhập, bất kể template:
//         return !!(document.querySelector('.user-notificaiton')
//             || document.querySelector('#t_Button_navControl')   // nút user menu của Universal Theme
//             || (window.apex && apex.env && apex.env.APP_USER && apex.env.APP_USER !== 'nobody'));
//     }
//     // URL tuyệt đối của sse-worker.js. KHÔNG dùng #APP_FILES# trực tiếp — nó là path
//     // tương đối (vd 'r/dev/.../files/...'), new SharedWorker() resolve so với URL trang
//     // (đang ở sâu trong /ords/r/dev/...) → nhân đôi path → 404 → worker fail âm thầm.
//     //
//     // Cách chắc chắn: global.js ĐÃ load thành công, nên thẻ <script> của nó mang URL
//     // đã được APEX resolve đúng. Lấy URL đó, thay tên file → cùng thư mục, đúng 100%.
//     // global.js nằm trong subfolder 'js/' của theme; sse-worker.js nằm ở GỐC theme
//     // (#THEME_DB_FILES#sse-worker.js). Phải lùi ra khỏi 'js/' rồi mới ghép worker.
//     // (\.min)? giữ chỗ cho #MIN# khi production minify (global.min.js → sse-worker.min.js).
//     function workerScriptUrl() {
//         var scripts = document.getElementsByTagName('script');
//         for (var i = 0; i < scripts.length; i++) {
//             var src = scripts[i].src || '';
//             // global.js trong js/ → worker ở thư mục cha:
//             var m = src.match(/^(.*\/)js\/global(\.min)?\.js(\?.*)?$/);
//             if (m) return m[1] + 'sse-worker' + (m[2] || '') + '.js';
//             // global.js cùng cấp worker (phòng layout khác):
//             m = src.match(/^(.*\/)global(\.min)?\.js(\?.*)?$/);
//             if (m) return m[1] + 'sse-worker' + (m[2] || '') + '.js';
//         }
//         // Fallback hiếm gặp (không tìm thấy thẻ <script> global.js — vd bị inline):
//         try { return new URL('sse-worker.js', window.location.href).href; }
//         catch (e) { return 'sse-worker.js'; }
//     }

//     // ── SharedWorker ──────────────────────────────────────────────────────────

//     var _port = null;
//     var _pingTimer = null;
//     var _notifDebounce = null;

//     function initWorker(sseUrl) {
//         var workerUrl = workerScriptUrl();
//         console.log('[SSE] worker url =', workerUrl, '| sseUrl =', sseUrl);

//         var worker;
//         try {
//             worker = new SharedWorker(workerUrl);
//             _port = worker.port;
//         } catch (e) {
//             console.error('[SSE] Tạo SharedWorker thất bại (kiểm tra workerUrl 404?):', e);
//             return;
//         }
//         // SharedWorker với script 404/lỗi KHÔNG throw ở new — bắt qua onerror.
//         worker.onerror = function (e) {
//             console.error('[SSE] Worker load lỗi (URL 404 hoặc script lỗi):', workerUrl, e.message || e);
//         };

//         _port.onmessage = function (ev) {
//             var msg = ev.data;
//             if (msg.type === 'mint_token') {
//                 // Worker yêu cầu tab này mint token (tab này đang là leader).
//                 // aus_id resolve server-side qua :APP_USER — không gửi x01.
//                 apex.server.process('globalAjaxInitJson', { x01: 'sseToken' }, {
//                     dataType: 'text',
//                     success: function (token) {
//                         token = (token || '').trim();
//                         if (!token) console.warn('[SSE] sseToken trả rỗng (secret chưa cấu hình? hoặc chưa login?)');
//                         _port.postMessage({ type: 'token_response', token: token });
//                     },
//                     error: function () {
//                         console.error('[SSE] sseToken AJAX error');
//                         _port.postMessage({ type: 'token_response', token: '' });
//                     }
//                 });
//             } else if (msg.type === 'heartbeat_tick') {
//                 // aus_id resolve server-side qua :APP_USER — không gửi x01.
//                 apex.server.process('globalAjaxInitJson', { x01: 'chatHeartbeat' });
//             } else if (msg.type === 'sse_error') {
//                 console.error('[SSE] connection error:', msg.reason, msg);
//             } else {
//                 handleEvent(msg);
//             }
//         };

//         _port.start();
//         _port.postMessage({ type: 'init', sseUrl: sseUrl });

//         // Ping worker định kỳ để worker biết tab này còn sống
//         _pingTimer = setInterval(function () { _port.postMessage({ type: 'ping' }); }, 25000);
//     }

//     // ── Notification badge ────────────────────────────────────────────────────

//     function updateNotifBadge(count) {
//         var $badge = $('#notif-badge');
//         if (!$badge.length) return;
//         if (count > 0) {
//             $badge.text(count > 99 ? '99+' : count).show();
//         } else {
//             $badge.hide();
//         }
//     }

//     // Gộp các event 'notification' dồn dập → 1 lần gọi notificationCount (giảm AJAX).
//     function scheduleNotifCount() {
//         if (_notifDebounce) clearTimeout(_notifDebounce);
//         _notifDebounce = setTimeout(fetchNotifCount, 400);
//     }

//     function fetchNotifCount() {
//         // aus_id resolve server-side qua :APP_USER — không gửi x01.
//         apex.server.process('globalAjaxInitJson', { x01: 'notificationCount' }, {
//             dataType: 'json',
//             success: function (data) {
//                 if (data && data.state === 'success') updateNotifBadge(Number(data.count) || 0);
//                 else if (data) console.error('[notif]', data.message);
//             },
//             error: function () {
//                 console.warn('[notif] notificationCount AJAX error');
//             }
//         });
//     }

//     function fetchSseUrl(callback) {
//         globalHandleAjaxProcess(['globalAjaxInitJson', { x01: 'getUrlNodeJs' }, 'json']).then(function (urlObj) {
//             if (urlObj && urlObj.state === 'success' && urlObj.url) {
//                 console.log('[SSE] Node URL =', urlObj.url);
//                 callback(urlObj.url);
//             } else {
//                 console.error('[SSE] getUrlNodeJs failed:', urlObj && urlObj.message,
//                     '— kiểm tra system_paras code=\'NODEJS\'');
//                 callback(null);
//             }
//         }).catch(function (err) {
//             console.error('[SSE] getUrlNodeJs request error:', err);
//             callback(null);
//         });
//     }

//     function initNotifBell() {
//         var $li = $('.user-notificaiton');
//         if (!$li.length) return;

//         $li.css('position', 'relative').append(
//             '<span id="notif-badge" style="' +
//             'display:none;position:absolute;left:20px;' +
//             'background:var(--red-color,#D81F25);color:#fff;' +
//             'border-radius:10px;font-size:10px;font-weight:700;' +
//             'min-width:16px;height:16px;line-height:16px;' +
//             'text-align:center;padding:0 3px;pointer-events:none;z-index:10;' +
//             '"></span>'
//         );
//     }

//     // ── Event handler ─────────────────────────────────────────────────────────

//     function handleEvent(data) {
//         if (data.type === 'notification') {
//             scheduleNotifCount();
//             $(document).trigger('apex:notifEvent', [data]);
//         } else if (data.type === 'message' || data.type === 'typing' ||
//             data.type === 'typing_stop' || data.type === 'read') {
//             $(document).trigger('apex:chatEvent', [data]);
//         }
//     }

//     // ── Init ──────────────────────────────────────────────────────────────────

//     $(document).ready(function () {
//         // Guard đăng nhập — KHÔNG dùng aus_id ở client. Trang login: bỏ qua hoàn toàn
//         // (tránh JSON.parse('') crash khi gọi AJAX trên trang chưa đăng nhập).
//         if (!isAuthenticated()) {
//             console.log('[SSE] Chưa đăng nhập — bỏ qua real-time');
//             return;
//         }

//         window._eventsPoll = true;

//         initNotifBell();
//         fetchNotifCount();

//         fetchSseUrl(function (sseUrl) {
//             if (!sseUrl) {
//                 console.warn('[SSE] Không có Node URL — bỏ qua real-time (badge vẫn hoạt động qua fetchNotifCount)');
//                 return;
//             }
//             initWorker(sseUrl);
//         });

//         // Dọn timer khi rời trang (worker tự prune port chết, đây chỉ là dọn sạch phía tab)
//         window.addEventListener('beforeunload', function () {
//             if (_pingTimer) clearInterval(_pingTimer);
//             if (_notifDebounce) clearTimeout(_notifDebounce);
//         });
//     });
// })();

(function () {
    'use strict';
    if (window._eventsPoll) return;
    if (window.parent && window.parent !== window) return;

    // ── Helpers: login + worker URL (tự dò, KHÔNG cần set ở Page 0) ────────────

    // Đăng nhập? Ưu tiên window.IS_AUTHENTICATED (set Page 0 FGVD bằng '&APP_USER.').
    // Fallback: phần tử nav chuông '.user-notificaiton' chỉ render khi đã login.
    // function isAuthenticated() {
    //     if (typeof window.IS_AUTHENTICATED === 'boolean') return window.IS_AUTHENTICATED;
    //     return document.querySelector('.user-notificaiton') != null;
    // }

    function isAuthenticated() {
        // if (typeof window.IS_AUTHENTICATED === 'boolean') return window.IS_AUTHENTICATED; // vẫn ưu tiên nếu có
        // Marker chỉ xuất hiện khi đã đăng nhập, bất kể template:
        return !!(document.querySelector('.user-notificaiton')
            || document.querySelector('#t_Button_navControl')   // nút user menu của Universal Theme
            || (window.apex && apex.env && apex.env.APP_USER && apex.env.APP_USER !== 'nobody'));
    }
    // URL tuyệt đối của worker. KHÔNG dùng #WORKSPACE_FILES# trực tiếp — nó là path
    // tương đối, new SharedWorker() resolve so với URL trang (đang ở sâu trong
    // /ords/r/...) → nhân đôi path → 404 → worker fail âm thầm.
    //
    // Cách chắc chắn: global.js ĐÃ load thành công, nên thẻ <script> của nó mang URL
    // đã được APEX resolve đúng. Lấy URL đó, thay tên file → cùng thư mục, đúng 100%.
    // Deploy dạng Workspace Files, cùng thư mục #WORKSPACE_FILES#:
    //   global.js  →  'ws_js#MIN#.js'         (ws_js.js | ws_js.min.js)
    //   worker     →  'ws-sse-worker#MIN#.js' (ws-sse-worker.js | ws-sse-worker.min.js)
    // (\.min)? bám theo #MIN#: dev = '' , production minify = '.min' — giữ đồng bộ cả hai.
    function workerScriptUrl() {
        var scripts = document.getElementsByTagName('script');
        for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].src || '';
            // global.js = ws_js(.min).js → worker cùng thư mục = ws-sse-worker(.min).js
            var m = src.match(/^(.*\/)ws_js(\.min)?\.js(\?.*)?$/);
            if (m) return m[1] + 'ws-sse-worker' + (m[2] || '') + '.js';
        }
        // Fallback hiếm gặp (không tìm thấy thẻ <script> global.js — vd bị inline):
        try { return new URL('ws-sse-worker.js', window.location.href).href; }
        catch (e) { return 'ws-sse-worker.js'; }
    }

    // ── SharedWorker ──────────────────────────────────────────────────────────

    var _port = null;
    var _pingTimer = null;
    var _notifDebounce = null;

    function initWorker(sseUrl) {
        var workerUrl = workerScriptUrl();
        console.log('[SSE] worker url =', workerUrl, '| sseUrl =', sseUrl);

        var worker;
        try {
            worker = new SharedWorker(workerUrl);
            _port = worker.port;
        } catch (e) {
            console.error('[SSE] Tạo SharedWorker thất bại (kiểm tra workerUrl 404?):', e);
            return;
        }
        // SharedWorker với script 404/lỗi KHÔNG throw ở new — bắt qua onerror.
        worker.onerror = function (e) {
            console.error('[SSE] Worker load lỗi (URL 404 hoặc script lỗi):', workerUrl, e.message || e);
        };

        _port.onmessage = function (ev) {
            var msg = ev.data;
            if (msg.type === 'mint_token') {
                // Worker yêu cầu tab này mint token (tab này đang là leader).
                // aus_id resolve server-side qua :APP_USER — không gửi x01.
                apex.server.process('globalAjaxInitJson', { x01: 'sseToken' }, {
                    dataType: 'text',
                    success: function (token) {
                        token = (token || '').trim();
                        if (!token) console.warn('[SSE] sseToken trả rỗng (secret chưa cấu hình? hoặc chưa login?)');
                        _port.postMessage({ type: 'token_response', token: token });
                    },
                    error: function () {
                        console.error('[SSE] sseToken AJAX error');
                        _port.postMessage({ type: 'token_response', token: '' });
                    }
                });
            } else if (msg.type === 'heartbeat_tick') {
                // aus_id resolve server-side qua :APP_USER — không gửi x01.
                apex.server.process('globalAjaxInitJson', { x01: 'chatHeartbeat' });
            } else if (msg.type === 'sse_error') {
                console.error('[SSE] connection error:', msg.reason, msg);
            } else {
                handleEvent(msg);
            }
        };

        _port.start();
        _port.postMessage({ type: 'init', sseUrl: sseUrl });

        // Ping worker định kỳ để worker biết tab này còn sống
        _pingTimer = setInterval(function () { _port.postMessage({ type: 'ping' }); }, 25000);
    }

    // ── Notification badge ────────────────────────────────────────────────────

    function updateNotifBadge(count) {
        var $badge = $('#notif-badge');
        if (!$badge.length) return;
        if (count > 0) {
            $badge.text(count).show();
            // $badge.text(count > 99 ? '99+' : count).show();
        } else {
            $badge.hide();
        }
    }

    // Gộp các event 'notification' dồn dập → 1 lần gọi notificationCount (giảm AJAX).
    function scheduleNotifCount() {
        if (_notifDebounce) clearTimeout(_notifDebounce);
        _notifDebounce = setTimeout(fetchNotifCount, 400);
    }

    function fetchNotifCount() {
        // aus_id resolve server-side qua :APP_USER — không gửi x01.
        apex.server.process('globalAjaxInitJson', { x01: 'notificationCount' }, {
            dataType: 'json',
            success: function (data) {
                if (data && data.state === 'success') updateNotifBadge(Number(data.count) || 0);
                else if (data) console.error('[notif]', data.message);
            },
            error: function () {
                console.warn('[notif] notificationCount AJAX error');
            }
        });
    }

    // Node URL là config tĩnh (system_paras code='NODEJS') → cache 1 lần/phiên;
    // page sau đọc từ sessionStorage, bớt 1 AJAX mỗi lần load page (G4).
    // Dùng apex.server.process cho ĐỒNG NHẤT với sseToken/chatHeartbeat/
    // notificationCount — bỏ helper globalHandleAjaxProcess (không có trong repo) (G3).
    var _SSE_URL_CACHE_KEY = 'gs_node_url';

    function fetchSseUrl(callback) {
        var cached = null;
        try { cached = sessionStorage.getItem(_SSE_URL_CACHE_KEY); } catch (e) { }
        if (cached) { callback(cached); return; }

        apex.server.process('globalAjaxInitJson', { x01: 'getUrlNodeJs' }, {
            dataType: 'json',
            success: function (urlObj) {
                if (urlObj && urlObj.state === 'success' && urlObj.url) {
                    console.log('[SSE] Node URL =', urlObj.url);
                    try { sessionStorage.setItem(_SSE_URL_CACHE_KEY, urlObj.url); } catch (e) { }
                    callback(urlObj.url);
                } else {
                    console.error('[SSE] getUrlNodeJs failed:', urlObj && urlObj.message,
                        '— kiểm tra system_paras code=\'NODEJS\'');
                    callback(null);
                }
            },
            error: function () {
                console.error('[SSE] getUrlNodeJs request error');
                callback(null);
            }
        });
    }

    function initNotifBell() {
        var $li = $('.user-notificaiton');
        if (!$li.length) return;

        $li.css('position', 'relative').append(
            '<span id="notif-badge" style="' +
            'display:none;position:absolute;left:20px;' +
            'background:var(--red-color,#D81F25);color:#fff;' +
            'border-radius:10px;font-size:10px;font-weight:700;' +
            'min-width:16px;height:16px;line-height:16px;' +
            'text-align:center;padding:0 3px;pointer-events:none;z-index:10;' +
            '"></span>'
        );
    }

    // ── Event handler ─────────────────────────────────────────────────────────

    function handleEvent(data) {
        if (data.type === 'notification') {
            scheduleNotifCount();
            $(document).trigger('apex:notifEvent', [data]);
        } else if (data.type === 'message' || data.type === 'typing' ||
            data.type === 'typing_stop' || data.type === 'read') {
            $(document).trigger('apex:chatEvent', [data]);
        }
    }

    // ── Init ──────────────────────────────────────────────────────────────────

    $(document).ready(function () {
        // Guard đăng nhập — KHÔNG dùng aus_id ở client. Trang login: bỏ qua hoàn toàn
        // (tránh JSON.parse('') crash khi gọi AJAX trên trang chưa đăng nhập).
        if (!isAuthenticated()) {
            console.log('[SSE] Chưa đăng nhập — bỏ qua real-time');
            return;
        }

        window._eventsPoll = true;

        initNotifBell();
        fetchNotifCount();

        fetchSseUrl(function (sseUrl) {
            if (!sseUrl) {
                console.warn('[SSE] Không có Node URL — bỏ qua real-time (badge vẫn hoạt động qua fetchNotifCount)');
                return;
            }
            initWorker(sseUrl);
        });

        // Dọn timer khi rời trang (worker tự prune port chết, đây chỉ là dọn sạch phía tab)
        window.addEventListener('beforeunload', function () {
            if (_pingTimer) clearInterval(_pingTimer);
            if (_notifDebounce) clearTimeout(_notifDebounce);
        });
    });
})();
