/**
 * Admin Panel 
 */

document.addEventListener('DOMContentLoaded', () => {

    /**
     * Initializes the "Are you sure?" confirmation toggle for delete actions.
     */
    function setupConfirmation(containerId, rowSelector) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.addEventListener('click', (e) => {
            // Find the closest parent row to the clicked element
            const row = e.target.closest(rowSelector);
            if (!row) return;

            // Select the two button groups within this specific row
            const def = row.querySelector('.default-actions');
            const conf = row.querySelector('.confirm-actions');

            // Handle "Trash Icon" click
            if (e.target.closest('.delete-init')) {
                def.classList.add('hidden');
                conf.classList.remove('hidden');
                conf.classList.add('flex'); 
            }

            // Handle "No" button click
            if (e.target.closest('.delete-cancel')) {
                conf.classList.add('hidden');
                conf.classList.remove('flex');
                def.classList.remove('hidden');
            }
        });
    }

    // Initialize confirmation logic for both the dashboard list and the editor details list
    setupConfirmation('items-list', '.item-row');
    setupConfirmation('details-area', '.detail-row'); 

    /**
     * Sets up a Drag-and-Drop zone synchronized with a hidden file input.
     */
    function setupDropzone(dropzone, input, preview, fileArrayRef, isSingle = false) {
        if (!dropzone || !input || !preview) return;

        // Click-to-upload: Forward click from div to hidden input
        dropzone.addEventListener('click', () => input.click());

        // Visual feedback during drag
        dropzone.addEventListener('dragover', (e) => { 
            e.preventDefault(); 
            dropzone.classList.add('bg-neutral-200'); // Darken background
        });

        // Reset visual feedback on exit
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('bg-neutral-200'));

        // Handle File Drop
        dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('bg-neutral-200');
            handleFiles(e.dataTransfer.files);
        });

        // Handle Standard Input Selection
        input.addEventListener('change', (e) => handleFiles(e.target.files));

        /**
         * Processes selected files.
         */
        function handleFiles(files) {
            if (isSingle) {
                if (files.length > 0) {
                    const dt = new DataTransfer();
                    dt.items.add(files[0]);
                    input.files = dt.files; // Update the actual DOM input
                    renderPreview([files[0]]);
                }
            } else {
                Array.from(files).forEach(f => fileArrayRef.push(f));
                
                const dt = new DataTransfer();
                Array.from(files).forEach(f => dt.items.add(f));
                input.files = dt.files;
                
                renderPreview(Array.from(input.files));
            }
        }

        /**
         * Renders small text previews of selected files.
         */
        function renderPreview(files) {
            preview.innerHTML = '';
            files.forEach((file) => {
                const el = document.createElement('div');
                el.className = 'flex items-center gap-2 text-xs font-mono bg-slate-100 p-1 border border-slate-300';
                el.innerHTML = `<i class="fa-solid fa-file"></i> <span class="truncate max-w-xs">${file.name}</span>`;
                preview.appendChild(el);
            });
        }
    }

    const form = document.querySelector('form[enctype="multipart/form-data"]');
    if (form) {
        const imgFiles = []; 
        setupDropzone(
            document.getElementById('dz-images'),
            document.getElementById('newImages'),
            document.getElementById('preview-images'),
            imgFiles
        );

        const fileRef = { value: null };
        setupDropzone(
            document.getElementById('dz-file'),
            document.getElementById('productFile'),
            document.getElementById('preview-file'),
            fileRef,
            true
        );

        // Setup Markdown File Reader
        const mdBtn = document.getElementById('md-trigger');
        const mdInput = document.getElementById('md-file');
        const mdText = document.querySelector('textarea[name="content"]');
        
        if (mdBtn && mdInput && mdText) {
            mdBtn.addEventListener('click', () => mdInput.click());
            mdInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const r = new FileReader();
                    r.onload = (ev) => mdText.value = ev.target.result; // Fill textarea
                    r.readAsText(file);
                }
            });
        }
        
        // Setup Removal of Existing Images
        document.querySelectorAll('.remove-existing').forEach(btn => {
            btn.addEventListener('click', (e) => {
               e.target.closest('.existing-item').remove(); 
            });
        });
    }

    // --- AJAX Screenshot Generation ---
    const screenshotBtn = document.getElementById('btn-screenshot');

    if (screenshotBtn) {
        screenshotBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            const btn = e.currentTarget;
            const itemId = btn.dataset.itemId; // Reads data-item-id="<%= item.id %>"
            const errorContainer = document.getElementById('error-container');
            const errorMessage = document.getElementById('error-message');

            // Set Loading State (Visual Feedback)
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Generating...';
            btn.classList.add('opacity-50', 'cursor-not-allowed');
            btn.disabled = true;

            try {
                // Perform AJAX Request
                const response = await fetch(`/admin/items/generate-screenshot/${itemId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                const result = await response.json();

                // Handle Response
                if (result.success) {
                    // Success: Refresh to show the new image
                    window.location.reload();
                } else {
                    throw new Error(result.error || 'Unknown Error');
                }

            } catch (err) {
                // Handle Error
                // Reset Button
                btn.innerHTML = originalText;
                btn.classList.remove('opacity-50', 'cursor-not-allowed');
                btn.disabled = false;

                // Display Error Message on screen
                if (errorMessage && errorContainer) {
                    errorMessage.textContent = err.message;
                    errorContainer.classList.remove('hidden');
                } else {
                    // Fallback if error container is missing
                    alert(`Error: ${err.message}`);
                }
            }
        });
    }
});
