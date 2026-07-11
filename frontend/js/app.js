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
    const swapLanguagesBtn = document.getElementById('swap-languages-btn');

    const API_BASE_URL = 'http://127.0.0.1:8000/api';
    let languagesMap = {};
    let lastDetectedLanguage = null;

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
                clearError();
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
                })
                .catch(err => {
                    console.error('Failed to copy text: ', err);
                    showError('Failed to copy text to clipboard.');
                });
        });
    }

    /**
     * Fetch supported languages from the backend and populate dropdown selectors.
     */
    async function loadLanguages() {
        try {
            const response = await fetch(`${API_BASE_URL}/languages`);
            if (!response.ok) {
                throw new Error(`Failed to load languages (HTTP ${response.status})`);
            }
            const languages = await response.json();

            // Populate languagesMap
            languagesMap = {};
            languages.forEach(lang => {
                languagesMap[lang.code] = lang.name;
            });

            if (sourceSelect && targetSelect) {
                // Clear and rebuild options
                sourceSelect.innerHTML = '<option value="auto">Detect Language</option>';
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
            }
        } catch (error) {
            console.error('Error fetching languages:', error);
            showError('Could not connect to the translation service to load languages. Please ensure the backend is running.');
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
            targetTextarea.value = '';
            if (copyBtn) {
                copyBtn.disabled = true;
            }
            return;
        }

        // Same Source and Target Validation (except when source is "auto")
        if (source !== 'auto' && source === target) {
            showError('Source and target languages cannot be the same.');
            targetTextarea.value = '';
            if (copyBtn) {
                copyBtn.disabled = true;
            }
            return;
        }

        // Setup loading states
        clearError();
        const originalBtnText = translateBtn.textContent;
        translateBtn.disabled = true;
        translateBtn.textContent = 'Translating...';

        try {
            // First perform language detection to verify the input text
            const detectResponse = await fetch(`${API_BASE_URL}/detect`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text }),
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
                showError('The entered language is not supported or could not be identified.');
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
                    showError(`The entered text appears to be ${detectedLanguageName}, but you selected ${selectedLanguageName}. Please select the correct source language or use Detect Language.`);
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
            });

            if (!response.ok) {
                throw new Error(`Translation API returned HTTP ${response.status}`);
            }

            const data = await response.json();
            const translatedText = data.translated_text || '';
            const isIdentical = translatedText.trim().toLowerCase() === text.trim().toLowerCase();

            if (isIdentical && (!detectedCode || detectedCode === 'und' || !isSupported || confidence < 0.3)) {
                showError('The entered language is not supported or could not be identified.');
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
        } catch (error) {
            console.error('Translation error:', error);
            showError('An error occurred with the translation service. Please try again.');
            targetTextarea.value = '';
            if (copyBtn) {
                copyBtn.disabled = true;
            }
        } finally {
            // Restore button state
            translateBtn.disabled = false;
            translateBtn.textContent = originalBtnText;
        }
    }

    /**
     * Show a premium error banner below the toolbar.
     */
    function showError(message) {
        let banner = document.querySelector('.error-banner');
        if (!banner) {
            banner = document.createElement('div');
            banner.className = 'error-banner';

            const messageSpan = document.createElement('span');
            messageSpan.className = 'error-banner-message';
            banner.appendChild(messageSpan);

            const closeBtn = document.createElement('button');
            closeBtn.className = 'error-banner-close';
            closeBtn.innerHTML = '&times;';
            closeBtn.type = 'button';
            closeBtn.setAttribute('aria-label', 'Close error notification');
            closeBtn.addEventListener('click', () => banner.remove());
            banner.appendChild(closeBtn);

            const card = document.querySelector('.translation-card');
            const toolbar = document.querySelector('.translation-toolbar');
            if (card && toolbar) {
                card.insertBefore(banner, toolbar.nextSibling);
            }
        }

        const messageSpan = banner.querySelector('.error-banner-message');
        if (messageSpan) {
            messageSpan.textContent = message;
        }
    }

    /**
     * Clear the error banner if one exists.
     */
    function clearError() {
        const banner = document.querySelector('.error-banner');
        if (banner) {
            banner.remove();
        }
    }
});

