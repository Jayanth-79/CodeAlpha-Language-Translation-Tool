/**
 * Language Translation Tool - Frontend Application Client
 * Handles API integration, language selection population, translations,
 * language swapping, clipboard copy, and error messages.
 */

document.addEventListener('DOMContentLoaded', () => {
    console.log('UI Foundation successfully initialized.');

    // DOM Element References
    const sourceSelect = document.getElementById('source-lang-select');
    const targetSelect = document.getElementById('target-lang-select');
    const sourceTextarea = document.getElementById('source-textarea');
    const targetTextarea = document.getElementById('target-textarea');
    const charCounter = document.getElementById('char-counter');
    const translateBtn = document.getElementById('translate-btn');
    const copyBtn = document.getElementById('copy-btn');
    const downloadBtn = document.getElementById('download-btn');
    const swapLanguagesBtn = document.getElementById('swap-languages-btn');

    // Sync disabled state of download button with copy button programmatically
    if (copyBtn && downloadBtn) {
        const descriptor = Object.getOwnPropertyDescriptor(HTMLButtonElement.prototype, 'disabled');
        Object.defineProperty(copyBtn, 'disabled', {
            get() {
                return descriptor.get.call(this);
            },
            set(val) {
                descriptor.set.call(this, val);
                downloadBtn.disabled = val;
            }
        });
    }

    const API_BASE_URL = 'http://127.0.0.1:8000/api';
    let languagesMap = {};
    let lastDetectedLanguage = null;

    // Custom Searchable Dropdown Class for UX Enhancement
    class CustomDropdown {
        constructor(containerEl, selectEl, isSource) {
            this.container = containerEl;
            this.select = selectEl;
            this.isSource = isSource;
            this.trigger = this.container.querySelector('.dropdown-trigger');
            this.selectedText = this.trigger.querySelector('.selected-text');
            this.menu = this.container.querySelector('.dropdown-menu');
            this.searchInput = this.container.querySelector('.dropdown-search-input');
            this.optionsList = this.container.querySelector('.dropdown-options');
            
            this.highlightedIndex = -1;
            this.options = []; // Array of { value, text, element }

            this.init();
        }

        init() {
            // Toggle dropdown open/close
            this.trigger.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggle();
            });

            // Handle typing in search input
            this.searchInput.addEventListener('input', () => {
                this.filterOptions();
            });

            // Prevent closing when clicking inside search input
            this.searchInput.addEventListener('click', (e) => {
                e.stopPropagation();
            });

            // Close on escape key in search input
            this.searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.close();
                    this.trigger.focus();
                    e.preventDefault();
                }
            });

            // Keyboard navigation
            this.container.addEventListener('keydown', (e) => {
                this.handleKeydown(e);
            });

            // Global click outside listener
            document.addEventListener('click', () => {
                this.close();
            });
        }

        toggle() {
            const isActive = this.container.classList.contains('active');
            // Close other dropdowns
            document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
                if (dropdown !== this.container) {
                    dropdown.classList.remove('active');
                    dropdown.querySelector('.dropdown-trigger').setAttribute('aria-expanded', 'false');
                }
            });

            if (isActive) {
                this.close();
            } else {
                this.open();
            }
        }

        open() {
            this.container.classList.add('active');
            this.trigger.setAttribute('aria-expanded', 'true');
            this.searchInput.value = '';
            this.filterOptions();
            this.searchInput.focus();
            
            const selectedOptIndex = this.options.findIndex(opt => opt.value === this.select.value);
            this.highlightIndex(selectedOptIndex);
        }

        close() {
            if (this.container.classList.contains('active')) {
                this.container.classList.remove('active');
                this.trigger.setAttribute('aria-expanded', 'false');
                this.highlightedIndex = -1;
            }
        }

        rebuild() {
            this.optionsList.innerHTML = '';
            this.options = [];

            Array.from(this.select.options).forEach((nativeOpt) => {
                const li = document.createElement('li');
                li.className = 'dropdown-option';
                li.setAttribute('role', 'option');
                li.setAttribute('data-value', nativeOpt.value);
                li.textContent = nativeOpt.textContent;

                li.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectOption(nativeOpt.value);
                });

                this.optionsList.appendChild(li);
                this.options.push({
                    value: nativeOpt.value,
                    text: nativeOpt.textContent,
                    element: li
                });
            });

            this.updateUI();
        }

        selectOption(value) {
            this.select.value = value;
            this.select.dispatchEvent(new Event('change'));
            this.close();
            this.trigger.focus();
        }

        updateUI() {
            const currentValue = this.select.value;
            const currentOpt = this.options.find(opt => opt.value === currentValue);
            
            if (currentOpt) {
                this.selectedText.textContent = currentOpt.text;
                this.options.forEach(opt => {
                    if (opt.value === currentValue) {
                        opt.element.classList.add('selected');
                        opt.element.setAttribute('aria-selected', 'true');
                    } else {
                        opt.element.classList.remove('selected');
                        opt.element.setAttribute('aria-selected', 'false');
                    }
                });
            } else {
                this.selectedText.textContent = this.isSource ? 'Auto' : '';
            }
        }

        filterOptions() {
            const query = this.searchInput.value.toLowerCase().trim();
            let firstVisibleIndex = -1;
            
            this.options.forEach((opt, idx) => {
                const matches = opt.text.toLowerCase().includes(query);
                if (matches) {
                    opt.element.style.display = '';
                    if (firstVisibleIndex === -1) {
                        firstVisibleIndex = idx;
                    }
                } else {
                    opt.element.style.display = 'none';
                }
            });

            this.highlightIndex(firstVisibleIndex);
        }

        highlightIndex(index) {
            this.options.forEach(opt => opt.element.classList.remove('highlighted'));
            this.highlightedIndex = index;

            if (index >= 0 && index < this.options.length) {
                const opt = this.options[index];
                opt.element.classList.add('highlighted');
                
                const containerHeight = this.optionsList.clientHeight;
                const elemTop = opt.element.offsetTop;
                const elemHeight = opt.element.clientHeight;
                const scrollOffset = this.optionsList.scrollTop;

                if (elemTop < scrollOffset) {
                    this.optionsList.scrollTop = elemTop;
                } else if (elemTop + elemHeight > scrollOffset + containerHeight) {
                    this.optionsList.scrollTop = elemTop + elemHeight - containerHeight;
                }
            }
        }

        getVisibleOptions() {
            return this.options
                .map((opt, index) => ({ opt, index }))
                .filter(item => item.opt.element.style.display !== 'none');
        }

        handleKeydown(e) {
            if (!this.container.classList.contains('active')) {
                if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
                    this.open();
                    e.preventDefault();
                }
                return;
            }

            const visibleOptions = this.getVisibleOptions();
            if (visibleOptions.length === 0) return;

            const currentHighlightIndexInVisible = visibleOptions.findIndex(item => item.index === this.highlightedIndex);

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const nextIndexInVisible = (currentHighlightIndexInVisible + 1) % visibleOptions.length;
                this.highlightIndex(visibleOptions[nextIndexInVisible].index);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prevIndexInVisible = (currentHighlightIndexInVisible - 1 + visibleOptions.length) % visibleOptions.length;
                this.highlightIndex(visibleOptions[prevIndexInVisible].index);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (this.highlightedIndex >= 0 && this.highlightedIndex < this.options.length) {
                    this.selectOption(this.options[this.highlightedIndex].value);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                this.close();
                this.trigger.focus();
            }
        }
    }

    function interceptSelectValue(selectEl, onSet) {
        const descriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
        Object.defineProperty(selectEl, 'value', {
            get() {
                return descriptor.get.call(this);
            },
            set(val) {
                descriptor.set.call(this, val);
                onSet(val);
            }
        });
    }

    // Intercept select value sets to update custom dropdowns
    let sourceDropdown = null;
    let targetDropdown = null;

    if (sourceSelect) {
        interceptSelectValue(sourceSelect, (val) => {
            if (sourceDropdown) sourceDropdown.updateUI();
        });
    }
    if (targetSelect) {
        interceptSelectValue(targetSelect, (val) => {
            if (targetDropdown) targetDropdown.updateUI();
        });
    }

    const sourceCustomDropdownEl = document.getElementById('source-custom-dropdown');
    const targetCustomDropdownEl = document.getElementById('target-custom-dropdown');

    if (sourceCustomDropdownEl && sourceSelect) {
        sourceDropdown = new CustomDropdown(sourceCustomDropdownEl, sourceSelect, true);
    }
    if (targetCustomDropdownEl && targetSelect) {
        targetDropdown = new CustomDropdown(targetCustomDropdownEl, targetSelect, false);
    }

    // Fetch and populate supported languages on load
    loadLanguages();

    // Character counter updates as user inputs text
    if (sourceTextarea && charCounter) {
        sourceTextarea.addEventListener('input', () => {
            let text = sourceTextarea.value;

            // Strictly cap at 5000 characters
            if (text.length > 5000) {
                text = text.slice(0, 5000);
                sourceTextarea.value = text;
            }

            charCounter.textContent = `${text.length} / 5000`;

            // If source is cleared, automatically clear target translation
            if (text.trim() === '') {
                targetTextarea.value = '';
                copyBtn.disabled = true;
            }
        });
    }

    // Translate button click action
    if (translateBtn) {
        translateBtn.addEventListener('click', performTranslation);
    }

    // Swap languages and text action
    if (swapLanguagesBtn) {
        swapLanguagesBtn.addEventListener('click', () => {
            console.log("SWAP BUTTON CLICKED - MY VERSION");
            if (!sourceSelect || !targetSelect) return;

            const sourceVal = sourceSelect.value;
            const targetVal = targetSelect.value;

            // 1. Swap the selected source language and target language
            let effectiveSource = sourceVal;
            if (sourceVal === 'auto') {
                // If source language is "Detect Language", replace it with the detected language from the latest successful translation before swapping
                effectiveSource = lastDetectedLanguage || (targetVal === 'en' ? 'es' : 'en');
            }

            sourceSelect.value = targetVal;
            targetSelect.value = effectiveSource;

            // 2. Swap the source textarea and translated textarea contents exactly
            if (sourceTextarea && targetTextarea) {
                const oldSourceText = sourceTextarea.value;
                const oldTargetText = targetTextarea.value;

                sourceTextarea.value = oldTargetText;
                targetTextarea.value = oldSourceText;

                // Update character counter for new source text
                if (charCounter) {
                    charCounter.textContent = `${sourceTextarea.value.length} / 5000`;
                }

                // Update copy button state
                if (copyBtn) {
                    copyBtn.disabled = !targetTextarea.value.trim();
                }
            }
        });
    }

    // Copy to clipboard action using Clipboard API
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            if (!targetTextarea || !targetTextarea.value) return;

            navigator.clipboard.writeText(targetTextarea.value)
                .then(() => {
                    // Provide visual feedback for copy
                    const originalHTML = copyBtn.innerHTML;
                    copyBtn.innerHTML = `
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Copied!
                    `;
                    copyBtn.disabled = true;
                    setTimeout(() => {
                        copyBtn.innerHTML = originalHTML;
                        copyBtn.disabled = false;
                    }, 2000);

                    // Show success toast
                    showToast('Text copied successfully.', 'success');
                })
                .catch(err => {
                    console.error('Failed to copy text: ', err);
                    showToast('Failed to copy text to clipboard.', 'error');
                });
        });
    }

    // Download to text file action
    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            const translatedText = targetTextarea ? targetTextarea.value.trim() : '';
            if (!translatedText) {
                showToast('No translated text available to download.', 'warning');
                return;
            }

            const sourceLang = sourceSelect.options[sourceSelect.selectedIndex]?.text || sourceSelect.value || 'Unknown';
            const targetLang = targetSelect.options[targetSelect.selectedIndex]?.text || targetSelect.value || 'Unknown';
            const sourceText = sourceTextarea ? sourceTextarea.value : '';

            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const day = String(now.getDate()).padStart(2, '0');
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');

            const filename = `translation_${year}-${month}-${day}_${hours}-${minutes}.txt`;
            const localDateTime = now.toLocaleString();

            const content = `----------------------------------------

Language Translation Tool

Source Language:
${sourceLang}

Target Language:
${targetLang}

----------------------------------------

Source Text:

${sourceText}

----------------------------------------

Translated Text:

${translatedText}

----------------------------------------

Generated on:
${localDateTime}

----------------------------------------`;

            const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        });
    }

    /**
     * Fetch supported languages from the backend and populate dropdown selectors.
     */
    async function loadLanguages() {
        if (!navigator.onLine) {
            showToast('Could not connect to the translation service. Please check your network connection.', 'error');
            return;
        }

        // Show loading info toast
        showToast('Loading languages...', 'info');

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            const response = await fetch(`${API_BASE_URL}/languages`, { signal: controller.signal });
            if (!response.ok) {
                throw new Error(`Failed to load languages (HTTP ${response.status})`);
            }
            const languages = await response.json();
            clearTimeout(timeoutId);

            // Populate languagesMap
            languagesMap = {};
            languages.forEach(lang => {
                languagesMap[lang.code] = lang.name;
            });

            if (sourceSelect && targetSelect) {
                // Clear and rebuild options
                sourceSelect.innerHTML = '<option value="auto">Auto</option>';
                targetSelect.innerHTML = '';

                languages.forEach(lang => {
                    // Add to source select
                    const srcOpt = document.createElement('option');
                    srcOpt.value = lang.code;
                    srcOpt.textContent = lang.name;
                    sourceSelect.appendChild(srcOpt);

                    // Add to target select
                    const tgtOpt = document.createElement('option');
                    tgtOpt.value = lang.code;
                    tgtOpt.textContent = lang.name;
                    targetSelect.appendChild(tgtOpt);
                });

                // Default selections: Detect Language -> Spanish (or English fallback)
                sourceSelect.value = 'auto';
                if (languages.some(l => l.code === 'es')) {
                    targetSelect.value = 'es';
                } else if (languages.some(l => l.code === 'en')) {
                    targetSelect.value = 'en';
                } else if (languages.length > 0) {
                    targetSelect.value = languages[0].code;
                }

                // Rebuild custom dropdown options after populating the native select elements
                if (sourceDropdown) sourceDropdown.rebuild();
                if (targetDropdown) targetDropdown.rebuild();
            }
        } catch (error) {
            clearTimeout(timeoutId);
            console.error('Error fetching languages:', error);
            if (error.name === 'AbortError') {
                showToast('Loading languages timed out. Please refresh the page to try again.', 'error');
            } else {
                showToast('Something went wrong. Please try again later.', 'error');
            }
        }
    }

    /**
     * Perform the translation request using current inputs.
     */
    async function performTranslation() {
        if (!sourceTextarea || !targetTextarea || !sourceSelect || !targetSelect) return;

        const text = sourceTextarea.value.trim();
        const source = sourceSelect.value;
        const target = targetSelect.value;

        // Skip translation for empty or whitespace-only text
        if (!text) {
            showToast('Please enter some text to translate.', 'warning');
            targetTextarea.value = '';
            if (copyBtn) {
                copyBtn.disabled = true;
            }
            return;
        }

        // Same Source and Target Validation (except when source is "auto")
        if (source !== 'auto' && source === target) {
            showToast('Source and target languages cannot be the same.', 'warning');
            targetTextarea.value = '';
            if (copyBtn) {
                copyBtn.disabled = true;
            }
            return;
        }

        if (!navigator.onLine) {
            showToast('Unable to connect to the translation service. Please check your network connection.', 'error');
            return;
        }

        // Setup loading states
        const originalBtnText = translateBtn.innerHTML;
        const originalBtnWidth = translateBtn.offsetWidth;
        translateBtn.style.width = `${originalBtnWidth}px`;
        translateBtn.disabled = true;
        translateBtn.innerHTML = `
            <svg class="spinner" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="display: inline-block; vertical-align: middle;">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" fill="none"></circle>
                <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-linecap="round"></path>
            </svg>
            <span>Translating...</span>
        `;
        if (targetTextarea) {
            targetTextarea.classList.add('loading-shimmer');
        }

        // Show Toast Info: Detecting or Translating
        if (source === 'auto') {
            showToast('Detecting language...', 'info');
        } else {
            showToast('Translating...', 'info');
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        try {
            // First perform language detection to verify the input text
            const detectResponse = await fetch(`${API_BASE_URL}/detect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
                signal: controller.signal
            });

            if (!detectResponse.ok) {
                throw new Error(`Detection API returned HTTP ${detectResponse.status}`);
            }

            const detectData = await detectResponse.json();
            const detectedCode = detectData.language;
            const confidence = detectData.confidence;

            const isSupported = languagesMap.hasOwnProperty(detectedCode);

            // Unsupported or Unrecognized Language check
            if (!detectedCode || detectedCode === 'und' || !isSupported || confidence < 0.2) {
                showToast('The entered language is not supported or could not be identified.', 'error');
                targetTextarea.value = '';
                if (copyBtn) {
                    copyBtn.disabled = true;
                }
                return;
            }

            // Source Language Verification (only if source is manually selected)
            if (source !== 'auto') {
                if (detectedCode !== source) {
                    const detectedLanguageName = languagesMap[detectedCode] || detectedCode;
                    const selectedLanguageName = languagesMap[source] || source;
                    showToast(`The entered text appears to be ${detectedLanguageName}, but you selected ${selectedLanguageName}. Please select the correct source language or use Detect Language.`, 'warning');
                    targetTextarea.value = '';
                    if (copyBtn) {
                        copyBtn.disabled = true;
                    }
                    return;
                }
            }

            // Now perform actual translation
            const response = await fetch(`${API_BASE_URL}/translate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text, source, target }),
                signal: controller.signal
            });

            if (!response.ok) {
                throw new Error(`Translation API returned HTTP ${response.status}`);
            }

            const data = await response.json();
            const translatedText = data.translated_text || '';
            const isIdentical = translatedText.trim().toLowerCase() === text.trim().toLowerCase();

            if (isIdentical && (!detectedCode || detectedCode === 'und' || !isSupported || confidence < 0.3)) {
                showToast('The entered language is not supported or could not be identified.', 'error');
                targetTextarea.value = '';
                if (copyBtn) {
                    copyBtn.disabled = true;
                }
                return;
            }

            targetTextarea.value = translatedText;
            lastDetectedLanguage = detectedCode;

            // Enable copy button now that we have translation output
            if (copyBtn) {
                copyBtn.disabled = !translatedText;
            }

            // Save translation to history
            saveTranslationToHistory(text, source, target, translatedText);

            // Show success toast
            showToast('Translation completed.', 'success');
            clearTimeout(timeoutId);
        } catch (error) {
            clearTimeout(timeoutId);
            console.error('Translation error:', error);
            if (error.name === 'AbortError') {
                showToast('Translation request timed out. Please check your connection.', 'error');
            } else {
                showToast('Translation failed. Please try again.', 'error');
            }
            targetTextarea.value = '';
            if (copyBtn) {
                copyBtn.disabled = true;
            }
        } finally {
            // Restore button state
            translateBtn.disabled = false;
            translateBtn.innerHTML = originalBtnText;
            translateBtn.style.width = '';
            if (targetTextarea) {
                targetTextarea.classList.remove('loading-shimmer');
            }
        }
    }



    // ==========================================
    // TRANSLATION HISTORY FEATURE IMPLEMENTATION
    // ==========================================
    
    function saveTranslationToHistory(sourceText, sourceCode, targetCode, translatedText) {
        if (!sourceText.trim() || !translatedText.trim()) return;
        
        let history = JSON.parse(localStorage.getItem('translation_history') || '[]');
        
        // Find language names
        let sourceName = '';
        if (sourceCode === 'auto') {
            const detectedName = languagesMap[lastDetectedLanguage] || lastDetectedLanguage || 'Unknown';
            sourceName = `${detectedName} (Detected)`;
        } else {
            sourceName = languagesMap[sourceCode] || sourceCode;
        }
        const targetName = languagesMap[targetCode] || targetCode;
        
        const timestamp = new Date().toLocaleString(undefined, {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const item = {
            id: Date.now().toString(),
            sourceText,
            sourceCode,
            sourceName,
            targetCode,
            targetName,
            translatedText,
            timestamp
        };
        
        // Prevent duplicate consecutive entries
        if (history.length > 0) {
            const last = history[0];
            if (last.sourceText === sourceText && last.sourceCode === sourceCode && last.targetCode === targetCode) {
                return;
            }
        }
        
        history.unshift(item);
        if (history.length > 20) {
            history = history.slice(0, 20);
        }
        
        localStorage.setItem('translation_history', JSON.stringify(history));
    }

    // History Drawer Logic
    const historyBtn = document.getElementById('history-btn');
    const historyDrawer = document.getElementById('history-drawer');
    const closeHistoryBtn = document.getElementById('close-history-btn');
    const historyDrawerBackdrop = document.getElementById('history-drawer-backdrop');
    const clearAllHistoryBtn = document.getElementById('clear-all-history-btn');
    const historyItemsContainer = document.getElementById('history-items-container');

    function escapeHTML(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function renderHistory() {
        if (!historyItemsContainer) return;
        
        const history = JSON.parse(localStorage.getItem('translation_history') || '[]');
        
        if (history.length === 0) {
            historyItemsContainer.innerHTML = `
                <div class="history-empty-state">
                    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <p>No translations yet.</p>
                </div>
            `;
            if (clearAllHistoryBtn) clearAllHistoryBtn.style.display = 'none';
            return;
        }

        if (clearAllHistoryBtn) clearAllHistoryBtn.style.display = 'block';

        historyItemsContainer.innerHTML = history.map(item => `
            <div class="history-item" data-id="${item.id}">
                <div class="history-item-header">
                    <div class="history-item-languages">
                        <span>${item.sourceName}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                        </svg>
                        <span>${item.targetName}</span>
                    </div>
                    <button class="delete-history-item-btn" data-id="${item.id}" aria-label="Delete history item" type="button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
                <div class="history-item-body">
                    <div class="history-item-text">${escapeHTML(item.sourceText)}</div>
                    <div class="history-item-translated">${escapeHTML(item.translatedText)}</div>
                </div>
                <div class="history-item-footer" style="color: var(--text-muted); font-size: 0.75rem; text-align: right; font-weight: 555; margin-top: 0.25rem;">
                    ${item.timestamp}
                </div>
            </div>
        `).join('');

        // Attach event listeners to items
        const items = historyItemsContainer.querySelectorAll('.history-item');
        items.forEach(el => {
            el.addEventListener('click', (e) => {
                const id = el.getAttribute('data-id');
                const historyItem = history.find(x => x.id === id);
                if (historyItem) {
                    restoreHistoryItem(historyItem);
                }
            });
        });

        // Attach delete button listeners
        const deleteButtons = historyItemsContainer.querySelectorAll('.delete-history-item-btn');
        deleteButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = btn.getAttribute('data-id');
                deleteHistoryItem(id);
            });
        });
    }

    function deleteHistoryItem(id) {
        let history = JSON.parse(localStorage.getItem('translation_history') || '[]');
        history = history.filter(item => item.id !== id);
        localStorage.setItem('translation_history', JSON.stringify(history));
        renderHistory();
    }

    function clearAllHistory() {
        showConfirmModal(
            'Clear translation history?',
            'This action cannot be undone.',
            () => {
                localStorage.removeItem('translation_history');
                renderHistory();
            }
        );
    }

    function restoreHistoryItem(item) {
        // Restore source and target select values
        if (sourceSelect) {
            sourceSelect.value = item.sourceCode;
            sourceSelect.dispatchEvent(new Event('change'));
        }
        if (targetSelect) {
            targetSelect.value = item.targetCode;
            targetSelect.dispatchEvent(new Event('change'));
        }

        // Restore textareas
        if (sourceTextarea) {
            sourceTextarea.value = item.sourceText;
            sourceTextarea.dispatchEvent(new Event('input'));
        }
        if (targetTextarea) {
            targetTextarea.value = item.translatedText;
        }

        if (copyBtn) {
            copyBtn.disabled = !item.translatedText;
        }

        closeDrawer();
    }

    let historyActiveElement = null;

    function openDrawer() {
        if (historyDrawer) {
            historyActiveElement = document.activeElement;
            historyDrawer.classList.add('active');
            historyDrawer.setAttribute('aria-hidden', 'false');
            renderHistory();
            if (closeHistoryBtn) {
                closeHistoryBtn.focus();
            }
            window.addEventListener('keydown', handleDrawerKeyDown);
            historyDrawer.addEventListener('keydown', handleDrawerTab);
        }
    }

    function closeDrawer() {
        if (historyDrawer) {
            historyDrawer.classList.remove('active');
            historyDrawer.setAttribute('aria-hidden', 'true');
            window.removeEventListener('keydown', handleDrawerKeyDown);
            historyDrawer.removeEventListener('keydown', handleDrawerTab);
            if (historyActiveElement) {
                historyActiveElement.focus();
            }
        }
    }

    function handleDrawerKeyDown(e) {
        if (e.key === 'Escape') {
            closeDrawer();
        }
    }

    function handleDrawerTab(e) {
        if (e.key === 'Tab') {
            const focusables = Array.from(
                historyDrawer.querySelectorAll('button, [tabindex="0"]')
            ).filter(el => !el.disabled && el.offsetWidth > 0 && el.offsetHeight > 0);
            
            if (focusables.length === 0) return;
            
            const firstFocusable = focusables[0];
            const lastFocusable = focusables[focusables.length - 1];
            
            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    lastFocusable.focus();
                    e.preventDefault();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    firstFocusable.focus();
                    e.preventDefault();
                }
            }
        }
    }

    // Event Wireups
    if (historyBtn) {
        historyBtn.addEventListener('click', openDrawer);
    }
    if (closeHistoryBtn) {
        closeHistoryBtn.addEventListener('click', closeDrawer);
    }
    if (historyDrawerBackdrop) {
        historyDrawerBackdrop.addEventListener('click', closeDrawer);
    }
    if (clearAllHistoryBtn) {
        clearAllHistoryBtn.addEventListener('click', clearAllHistory);
    }

    // ==========================================
    // CLEAR SOURCE & CLEAR TRANSLATION ACTIONS (WITH CUSTOM MODALS)
    // ==========================================
    
    const clearSourceBtn = document.getElementById('clear-source-btn');
    if (clearSourceBtn) {
        clearSourceBtn.addEventListener('click', () => {
            const sourceText = sourceTextarea ? sourceTextarea.value.trim() : '';
            if (!sourceText) {
                showToast('Source text is already empty.', 'warning');
                return;
            }
            showConfirmModal(
                'Clear source text?',
                'This will remove the source text and the current translation.',
                () => {
                    if (sourceTextarea) {
                        sourceTextarea.value = '';
                        sourceTextarea.focus();
                        sourceTextarea.dispatchEvent(new Event('input'));
                    }
                    if (targetTextarea) {
                        targetTextarea.value = '';
                    }
                    if (copyBtn) {
                        copyBtn.disabled = true;
                    }
                    
                    // Remove active toasts
                    const toastContainer = document.getElementById('toast-container');
                    if (toastContainer) {
                        toastContainer.innerHTML = '';
                        toastContainer.remove();
                    }
                }
            );
        });
    }

    const clearTargetBtn = document.getElementById('clear-target-btn');
    if (clearTargetBtn) {
        clearTargetBtn.addEventListener('click', () => {
            const targetText = targetTextarea ? targetTextarea.value.trim() : '';
            if (!targetText) {
                showToast('Translation is already empty.', 'warning');
                return;
            }
            showConfirmModal(
                'Clear translation?',
                'Only the translated text will be removed.',
                () => {
                    if (targetTextarea) {
                        targetTextarea.value = '';
                    }
                    if (copyBtn) {
                        copyBtn.disabled = true;
                    }
                }
            );
        });
    }

    // ==========================================
    // TOAST NOTIFICATION SYSTEM
    // ==========================================
    
    function showToast(message, type = 'info') {
        let container = document.getElementById('toast-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'toast-container';
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        const toast = document.createElement('div');
        toast.className = `toast-item toast-${type}`;
        toast.innerHTML = `
            <div class="toast-icon">
                ${getToastIcon(type)}
            </div>
            <div class="toast-message">${escapeHTML(message)}</div>
            <button class="toast-close-btn" aria-label="Close notification">&times;</button>
        `;

        container.appendChild(toast);

        // Timer for auto-dismiss
        let dismissTimeout;

        function startTimer() {
            dismissTimeout = setTimeout(() => {
                dismissToast(toast);
            }, 4000);
        }

        function stopTimer() {
            clearTimeout(dismissTimeout);
        }

        toast.addEventListener('mouseenter', stopTimer);
        toast.addEventListener('mouseleave', startTimer);

        const closeBtn = toast.querySelector('.toast-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dismissToast(toast);
            });
        }

        // Start timer initially
        startTimer();
    }

    function dismissToast(toast) {
        toast.classList.add('toast-leaving');
        const removeTimeout = setTimeout(() => {
            toast.remove();
            cleanToastContainer();
        }, 300);

        toast.addEventListener('transitionend', () => {
            clearTimeout(removeTimeout);
            toast.remove();
            cleanToastContainer();
        });
    }

    function cleanToastContainer() {
        const container = document.getElementById('toast-container');
        if (container && container.childElementCount === 0) {
            container.remove();
        }
    }

    function getToastIcon(type) {
        switch (type) {
            case 'success':
                return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
            case 'info':
                return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`;
            case 'warning':
                return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;
            case 'error':
                return `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>`;
            default:
                return '';
        }
    }

    // ==========================================
    // PREMIUM CONFIRMATION DIALOG (MODAL) SYSTEM
    // ==========================================
    
    function showConfirmModal(title, description, onConfirm) {
        const modal = document.getElementById('confirm-modal');
        const modalTitle = document.getElementById('confirm-modal-title');
        const modalDesc = document.getElementById('confirm-modal-desc');
        const cancelBtn = document.getElementById('confirm-modal-cancel');
        const okBtn = document.getElementById('confirm-modal-ok');
        
        if (!modal || !modalTitle || !modalDesc || !cancelBtn || !okBtn) return;
        
        modalTitle.textContent = title;
        modalDesc.textContent = description;
        
        const previousActiveElement = document.activeElement;
        
        // Show modal
        modal.classList.add('active');
        modal.setAttribute('aria-hidden', 'false');
        
        // Clean up previous event listeners by cloning
        const newOkBtn = okBtn.cloneNode(true);
        const newCancelBtn = cancelBtn.cloneNode(true);
        okBtn.parentNode.replaceChild(newOkBtn, okBtn);
        cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
        
        let handleKeyDown;
        let handleModalTab;
        
        function closeModal() {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            window.removeEventListener('keydown', handleKeyDown);
            modal.removeEventListener('keydown', handleModalTab);
            if (previousActiveElement) {
                previousActiveElement.focus();
            }
        }
        
        handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        
        const focusableElements = [newCancelBtn, newOkBtn];
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        
        newCancelBtn.focus();
        
        handleModalTab = (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        lastFocusable.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        firstFocusable.focus();
                        e.preventDefault();
                    }
                }
            }
        };
        modal.addEventListener('keydown', handleModalTab);
        
        newCancelBtn.addEventListener('click', closeModal);
        newOkBtn.addEventListener('click', () => {
            onConfirm();
            closeModal();
        });
        
        const backdrop = document.getElementById('confirm-modal-backdrop');
        if (backdrop) {
            const newBackdrop = backdrop.cloneNode(true);
            backdrop.parentNode.replaceChild(newBackdrop, backdrop);
            newBackdrop.addEventListener('click', closeModal);
        }
    }

    // ==========================================
    // PREMIUM ABOUT MODAL SYSTEM
    // ==========================================
    
    // ==========================================
    // PREMIUM ABOUT MODAL SYSTEM
    // ==========================================
    
    const aboutBtn = document.getElementById('about-btn');
    const aboutModal = document.getElementById('about-modal');
    const closeAboutBtn = document.getElementById('close-about-btn');
    const aboutModalBackdrop = document.getElementById('about-modal-backdrop');
    let aboutActiveElement = null;

    function openAboutModal() {
        if (aboutModal) {
            aboutActiveElement = document.activeElement;
            aboutModal.classList.add('active');
            aboutModal.setAttribute('aria-hidden', 'false');
            if (closeAboutBtn) {
                closeAboutBtn.focus();
            }
            window.addEventListener('keydown', handleAboutKeyDown);
            aboutModal.addEventListener('keydown', handleAboutTab);
        }
    }

    function closeAboutModal() {
        if (aboutModal) {
            aboutModal.classList.remove('active');
            aboutModal.setAttribute('aria-hidden', 'true');
            window.removeEventListener('keydown', handleAboutKeyDown);
            aboutModal.removeEventListener('keydown', handleAboutTab);
            if (aboutActiveElement) {
                aboutActiveElement.focus();
            }
        }
    }

    function handleAboutKeyDown(e) {
        if (e.key === 'Escape') {
            closeAboutModal();
        }
    }

    function handleAboutTab(e) {
        if (e.key === 'Tab') {
            e.preventDefault();
            if (closeAboutBtn) {
                closeAboutBtn.focus();
            }
        }
    }

    if (aboutBtn) {
        aboutBtn.addEventListener('click', openAboutModal);
    }
    if (closeAboutBtn) {
        closeAboutBtn.addEventListener('click', closeAboutModal);
    }
    if (aboutModalBackdrop) {
        aboutModalBackdrop.addEventListener('click', closeAboutModal);
    }

    // ==========================================
    // NAVIGATION SIDEBAR SYSTEM
    // ==========================================
    const menuToggleBtn = document.getElementById('menu-toggle-btn');
    const navSidebar = document.getElementById('nav-sidebar');
    const closeMenuBtn = document.getElementById('close-menu-btn');
    const navSidebarBackdrop = document.getElementById('nav-sidebar-backdrop');
    const sidebarItems = navSidebar ? navSidebar.querySelectorAll('.sidebar-item') : [];

    function openSidebar() {
        if (navSidebar) {
            navSidebar.classList.add('active');
            navSidebar.setAttribute('aria-hidden', 'false');
            if (closeMenuBtn) {
                closeMenuBtn.focus();
            }
            window.addEventListener('keydown', handleSidebarKeyDown);
        }
    }

    function closeSidebar() {
        if (navSidebar) {
            navSidebar.classList.remove('active');
            if (menuToggleBtn) {
                menuToggleBtn.focus();
            }
            navSidebar.setAttribute('aria-hidden', 'true');
            window.removeEventListener('keydown', handleSidebarKeyDown);
        }
    }

    function handleSidebarKeyDown(e) {
        if (e.key === 'Escape') {
            closeSidebar();
        }
    }

    if (menuToggleBtn) {
        menuToggleBtn.addEventListener('click', openSidebar);
    }
    if (closeMenuBtn) {
        closeMenuBtn.addEventListener('click', closeSidebar);
    }
    if (navSidebarBackdrop) {
        navSidebarBackdrop.addEventListener('click', closeSidebar);
    }
    sidebarItems.forEach(item => {
        item.addEventListener('click', closeSidebar);
    });
});

