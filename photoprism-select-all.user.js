// ==UserScript==
// @name         PhotoPrism Select All Button
// @namespace    https://github.com/yourname/photoprism-select-all-userscript
// @version      1.1
// @description  Adds a "Select All" button to the PhotoPrism library browse page.
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
*/

(function () {
    'use strict';

    // Wait for PhotoPrism to render the table header dynamically
    const observer = new MutationObserver(() => {
        const header = document.querySelector('th.col-select');

        if (header && !header.querySelector('.input-select')) {
            createSelectAllButton(header);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
})();

/**
 * Create the "Select All" button in the table header
 */
function createSelectAllButton(header) {

    const checkboxes = document.querySelectorAll('td.col-select .input-select');

    if (checkboxes.length === 0) return;

    // Create select-all button
    const selectAllBtn = document.createElement('button');

    selectAllBtn.innerHTML = `
        <i class="mdi mdi-checkbox-multiple-outline select-off"></i>
        <i class="mdi mdi-checkbox-multiple-marked select-on" style="display: none;"></i>
    `;

    selectAllBtn.className = 'input-select';
    selectAllBtn.title = 'Select All / Deselect All';

    // Insert button into table header
    header.appendChild(selectAllBtn);

    // Click event handler
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

                // Simulate user click to trigger PhotoPrism's internal selection logic
                cb.click();
            }
        });

        // Toggle select-all button icon
        const btnOn = selectAllBtn.querySelector('.select-on');
        const btnOff = selectAllBtn.querySelector('.select-off');

        btnOn.style.display = currentlyOn ? 'none' : 'inline-block';
        btnOff.style.display = currentlyOn ? 'inline-block' : 'none';
    });
}
