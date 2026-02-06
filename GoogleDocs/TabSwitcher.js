// ==UserScript==
// @name         Google Docs Instant Tab Search (Focus Fix)
// @namespace    http://tampermonkey.net/
// @version      1.2
// @description  Instant tab switching with guaranteed input focus
// @author       AI / Gemini
// @match        https://docs.google.com/document/d/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- CONFIGURATION ---
    const SHORTCUT_KEY = 'z'; // Alt + Z
    const PALETTE_WIDTH = '450px';

    const container = document.createElement('div');
    container.id = 'tab-search-palette';
    Object.assign(container.style, {
        position: 'fixed', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: PALETTE_WIDTH, backgroundColor: '#ffffff', border: '1px solid #ccc',
        borderRadius: '8px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)', zIndex: '10000',
        display: 'none', flexDirection: 'column', overflow: 'hidden', fontFamily: 'Segoe UI, Arial, sans-serif'
    });

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Search tabs...';
    Object.assign(input.style, {
        width: '100%', padding: '15px', fontSize: '18px', border: 'none',
        outline: 'none', borderBottom: '1px solid #eee', boxSizing: 'border-box'
    });

    const resultsList = document.createElement('div');
    resultsList.id = 'tab-results';
    Object.assign(resultsList.style, {
        maxHeight: '400px', overflowY: 'auto', backgroundColor: '#fff'
    });

    container.appendChild(input);
    container.appendChild(resultsList);
    document.body.appendChild(container);

    let tabs = [];
    let selectedIndex = 0;
    let filteredTabs = [];

    function scrapeTabs() {
        const tabElements = document.querySelectorAll('.chapter-item-label-and-buttons-container');
        return Array.from(tabElements).map(el => {
            const label = el.querySelector('.chapter-label-content');
            return {
                name: label ? label.textContent.trim() : "Unnamed Tab",
                element: el
            };
        }).filter(t => t.name !== "");
    }

    function renderResults() {
        resultsList.replaceChildren();
        filteredTabs.forEach((tab, index) => {
            const div = document.createElement('div');
            div.textContent = tab.name;
            Object.assign(div.style, {
                padding: '12px 15px', cursor: 'pointer', borderBottom: '1px solid #f0f0f0',
                backgroundColor: index === selectedIndex ? '#e8f0fe' : '#fff',
                color: index === selectedIndex ? '#1967d2' : '#333',
                fontWeight: index === selectedIndex ? '600' : '400'
            });
            div.onclick = () => selectTab(index);
            resultsList.appendChild(div);

            if (index === selectedIndex) {
                div.scrollIntoView({ block: 'nearest' });
            }
        });
    }

    function selectTab(index) {
        const target = filteredTabs[index];
        if (target) {
            target.element.click();
            closePalette();
        }
    }

    function closePalette() {
        container.style.display = 'none';
        input.value = '';
    }

    function openPalette() {
        tabs = scrapeTabs();
        filteredTabs = tabs;
        selectedIndex = 0;
        container.style.display = 'flex';
        
        // --- FIX: Using setTimeout to ensure focus triggers after UI render ---
        setTimeout(() => {
            input.focus();
            input.select();
        }, 10);

        renderResults();
    }

    window.addEventListener('keydown', (e) => {
        if (e.altKey && e.key.toLowerCase() === SHORTCUT_KEY) {
            e.preventDefault();
            e.stopImmediatePropagation(); // Prevents other listeners from interfering
            container.style.display === 'none' ? openPalette() : closePalette();
        }

        if (container.style.display === 'flex') {
            if (e.key === 'Escape') {
                closePalette();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                selectedIndex = Math.min(selectedIndex + 1, filteredTabs.length - 1);
                renderResults();
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                selectedIndex = Math.max(selectedIndex - 1, 0);
                renderResults();
            } else if (e.key === 'Enter') {
                e.preventDefault();
                selectTab(selectedIndex);
            }
        }
    }, true);

    input.addEventListener('input', () => {
        const query = input.value.toLowerCase();
        filteredTabs = tabs.filter(t => t.name.toLowerCase().includes(query));
        selectedIndex = 0;
        renderResults();
    });

})();
