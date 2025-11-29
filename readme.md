# Free Downloads System

A lightweight, file-based content management system designed for hosting and sharing digital assets. This application features a distinct Neo-Brutalist design powered by **Tailwind CSS**. It uses a local JSON file-based database, eliminating the need for external SQL servers, making it incredibly easy to deploy and maintain.

## Features

### 🏛️ Public Interface
*   **🔍 Search:** Real-time server-side search filtering across item titles and tags.
*   **📄 Pagination:** Built-in pagination logic to handle large libraries of content efficiently.
*   **🏷️ Taxonomy Browsing:** Filter content via a dedicated sidebar by Categories or explore related items via Tag clouds.
*   **⬇️ Secure Downloads:** file paths are masked from the end-user; the server proxies downloads to protect your internal directory structure.
*   **📱 Responsive Design:** A fully responsive, mobile-first interface featuring a high-contrast Neo-Brutalist aesthetic.

### 🔐 Admin Panel
*   **🛡️ Secure Authentication:** Session-based login system protected by environment variable credentials.
*   **🏗️ Stub-First:** "Initialize & Edit" for item creation, ensuring atomic data management.
*   **📝 Markdown Support:** Write descriptions in Markdown or upload `.md` files directly to auto-populate content fields.
*   **📂 Drag-and-Drop Uploads:** Modern drag-and-drop interface for uploading multiple screenshot galleries and product ZIP files.
*   **🗂️ Category Management:** Full CRUD (Create, Read, Update, Delete) capabilities for managing asset categories and FontAwesome icons.
*   **🧹 Automatic Cleanup:** Intelligent file management that scrubs orphaned images and files from the disk if a database transaction fails or an item is deleted.
