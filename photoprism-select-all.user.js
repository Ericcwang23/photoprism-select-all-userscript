// ==UserScript==
// @name         PhotoPrism Select All Button
// @namespace    https://github.com/yourname/photoprism-select-all-userscript
// @version      1.2
// @description  Adds a "Select All" button to the PhotoPrism library browse page. Persists selection across page reloads via localStorage.
// @author       Eric
// @match        http://localhost:2342/library/browse*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=photoprism.app
// @grant        none
// ==/UserScript==

/*
 PhotoPrism Select All Userscript
 --------------------------------
 Adds a "Select All" toggle button to the PhotoPrism library browsing page,
 allowing quick selection or deselection of all visible items.

 Selection state is persisted in localStorage so it survives page reloads.
*/

(function () {
    'use strict';

    const STORAGE_KEY = 'photoprism-selection-state';

    // ── Helpers ──────────────────────────────────────────────────────────

    function isSelected(checkbox) {
        const onIcon = checkbox.querySelector('.select-on');
        return onIcon && onIcon.style.display !== 'none';
    }

    function getItemUid(checkbox) {
        const row = checkbox.closest('[data-uid]');
        return row ? row.dataset.uid : null;
    }

    // ── Persistence ─────────────────────────────────────────────────────

    function saveSelectionState(selectAllActive) {
        const checkboxes = document.querySelectorAll('td.col-select .input-select');
        const selectedUids = [];
        const selectedIndices = [];

        checkboxes.forEach((cb, index) => {
            if (isSelected(cb)) {
                const uid = getItemUid(cb);
                if (uid) {
                    selectedUids.push(uid);
                } else {
                    selectedIndices.push(index);
                }
            }
        });

        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            uids: selectedUids,
            indices: selectedIndices,
            selectAll: selectAllActive,
            path: window.location.pathname
        }));
    }

    function restoreSelectionState() {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;

        try {
            const state = JSON.parse(raw);

            if (state.path !== window.location.pathname) return null;

            const checkboxes = document.querySelectorAll('td.col-select .input-select');
            if (checkboxes.length === 0) return null;

            // Restore by UID
            if (state.uids && state.uids.length > 0) {
                state.uids.forEach(uid => {
                    const uidEl = document.querySelector('[data-uid="' + uid + '"]');
                    if (!uidEl) return;

                    const cb = uidEl.querySelector('td.col-select .input-select')
                            || uidEl.querySelector('.input-select');
                    if (cb && !isSelected(cb)) {
                        cb.click();
                    }
                });
            }

            // Restore by index (fallback for items without data-uid)
            if (state.indices && state.indices.length > 0) {
                state.indices.forEach(index => {
                    const cb = checkboxes[index];
                    if (cb && !isSelected(cb)) {
                        cb.click();
                    }
                });
            }

            return state.selectAll || false;
        } catch (e) {
            console.warn('PhotoPrism Select All: failed to restore selection', e);
            return null;
        }
    }

    // ── Select All Button ───────────────────────────────────────────────

    function createSelectAllButton(header) {
        const checkboxes = document.querySelectorAll('td.col-select .input-select');
        if (checkboxes.length === 0) return;

        const selectAllBtn = document.createElement('button');
        selectAllBtn.innerHTML = `
            <i class="mdi mdi-checkbox-multiple-outline select-off"></i>
            <i class="mdi mdi-checkbox-multiple-marked select-on" style="display: none;"></i>
        `;
        selectAllBtn.className = 'input-select';
        selectAllBtn.title = 'Select All / Deselect All';

        header.appendChild(selectAllBtn);

        selectAllBtn.addEventListener('click', function () {
            const currentlyOn =
                selectAllBtn.querySelector('.select-on').style.display !== 'none';

            checkboxes.forEach(cb => {
                const onIcon = cb.querySelector('.select-on');
                const offIcon = cb.querySelector('.select-off');

                if (onIcon && offIcon) {
                    if (currentlyOn) {
                        onIcon.style.display = 'none';
                        offIcon.style.display = 'inline-block';
                    } else {
                        onIcon.style.display = 'inline-block';
                        offIcon.style.display = 'none';
                    }

                    cb.click();
                }
            });

            const newState = !currentlyOn;
            const btnOn = selectAllBtn.querySelector('.select-on');
            const btnOff = selectAllBtn.querySelector('.select-off');
            btnOn.style.display = newState ? 'inline-block' : 'none';
            btnOff.style.display = newState ? 'none' : 'inline-block';

            saveSelectionState(newState);
        });
    }

    // ── Bootstrap ───────────────────────────────────────────────────────

    let restored = false;

    const observer = new MutationObserver(() => {
        const header = document.querySelector('th.col-select');

        if (header && !header.querySelector('.input-select')) {
            createSelectAllButton(header);
        }

        if (!restored) {
            const checkboxes = document.querySelectorAll('td.col-select .input-select');
            if (checkboxes.length > 0) {
                restored = true;
                const selectAllBtn = header
                    ? header.querySelector('.input-select')
                    : null;

                const wasSelectAll = restoreSelectionState();

                if (wasSelectAll && selectAllBtn) {
                    const btnOn = selectAllBtn.querySelector('.select-on');
                    const btnOff = selectAllBtn.querySelector('.select-off');
                    if (btnOn) btnOn.style.display = 'inline-block';
                    if (btnOff) btnOff.style.display = 'none';
                }
            }
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Persist on individual checkbox clicks
    document.addEventListener('click', function (e) {
        const checkbox = e.target.closest('td.col-select .input-select');
        if (!checkbox) return;

        setTimeout(() => {
            const header = document.querySelector('th.col-select');
            const selectAllBtn = header
                ? header.querySelector('.input-select')
                : null;
            const selectAllActive = selectAllBtn
                ? isSelected(selectAllBtn)
                : false;

            saveSelectionState(selectAllActive);
        }, 100);
    });

    // Safety-net: persist before page unload
    window.addEventListener('beforeunload', () => {
        const header = document.querySelector('th.col-select');
        const selectAllBtn = header
            ? header.querySelector('.input-select')
            : null;
        const selectAllActive = selectAllBtn
            ? isSelected(selectAllBtn)
            : false;

        saveSelectionState(selectAllActive);
    });
})();
