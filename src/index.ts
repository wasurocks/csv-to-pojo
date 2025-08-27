import { buildOpenAPIFromCSV } from "./csvParser";
import { generateJavaCode } from "./codeGenerator";
import { saveAs } from "file-saver";

interface AppState {
    csvFile: File | null;
    isProcessing: boolean;
    generatedFiles: Map<string, string>;
}

class CSVToPojoApp {
    private state: AppState = {
        csvFile: null,
        isProcessing: false,
        generatedFiles: new Map(),
    };

    private elements: {
        uploadSection: HTMLElement;
        csvFileInput: HTMLInputElement;
        generateBtn: HTMLButtonElement;
        status: HTMLElement;
        preview: HTMLElement;
        previewContent: HTMLElement;
        apiTitle: HTMLInputElement;
        apiVersion: HTMLInputElement;
        modelPackage: HTMLInputElement;
    };

    constructor() {
        this.elements = this.getElements();
        this.setupEventListeners();
    }

    private getElements() {
        return {
            uploadSection: document.getElementById("uploadSection")!,
            csvFileInput: document.getElementById(
                "csvFile"
            ) as HTMLInputElement,
            generateBtn: document.getElementById(
                "generateBtn"
            ) as HTMLButtonElement,
            status: document.getElementById("status")!,
            preview: document.getElementById("preview")!,
            previewContent: document.getElementById("previewContent")!,
            apiTitle: document.getElementById("apiTitle") as HTMLInputElement,
            apiVersion: document.getElementById(
                "apiVersion"
            ) as HTMLInputElement,
            modelPackage: document.getElementById(
                "modelPackage"
            ) as HTMLInputElement,
        };
    }

    private setupEventListeners(): void {
        // File input change
        this.elements.csvFileInput.addEventListener("change", (e) => {
            const files = (e.target as HTMLInputElement).files;
            if (files && files.length > 0) {
                this.handleFileSelection(files[0]);
            }
        });

        // Drag and drop
        this.elements.uploadSection.addEventListener("dragover", (e) => {
            e.preventDefault();
            this.elements.uploadSection.classList.add("dragover");
        });

        this.elements.uploadSection.addEventListener("dragleave", () => {
            this.elements.uploadSection.classList.remove("dragover");
        });

        this.elements.uploadSection.addEventListener("drop", (e) => {
            e.preventDefault();
            this.elements.uploadSection.classList.remove("dragover");

            const files = e.dataTransfer?.files;
            if (files && files.length > 0) {
                this.handleFileSelection(files[0]);
            }
        });

        // Click to browse
        this.elements.uploadSection.addEventListener("click", () => {
            this.elements.csvFileInput.click();
        });

        // Generate button
        this.elements.generateBtn.addEventListener("click", () => {
            this.generateCode();
        });
    }

    private handleFileSelection(file: File): void {
        if (!file.name.toLowerCase().endsWith(".csv")) {
            this.showStatus("Please select a CSV file", "error");
            return;
        }

        this.state.csvFile = file;
        this.elements.generateBtn.disabled = false;
        this.showStatus(`File selected: ${file.name}`, "success");
        this.hidePreview();
    }

    private async generateCode(): Promise<void> {
        if (!this.state.csvFile) {
            this.showStatus("Please select a CSV file first", "error");
            return;
        }

        this.state.isProcessing = true;
        this.elements.generateBtn.disabled = true;
        this.showStatus("Processing CSV file...", "processing");

        try {
            const csvContent = await this.readFileAsText(this.state.csvFile);

            // Generate OpenAPI spec
            const openApiSpec = buildOpenAPIFromCSV(
                csvContent,
                this.elements.apiTitle.value,
                this.elements.apiVersion.value
            );

            // Generate Java code
            const javaFiles = generateJavaCode(
                openApiSpec,
                this.elements.modelPackage.value
            );

            this.state.generatedFiles = javaFiles;
            this.showGeneratedFiles();
            this.showStatus(
                `✅ Generated ${javaFiles.size} Java POJO(s)`,
                "success"
            );
        } catch (error) {
            console.error("Generation failed:", error);
            this.showStatus(
                `❌ Generation failed: ${(error as Error).message}`,
                "error"
            );
        } finally {
            this.state.isProcessing = false;
            this.elements.generateBtn.disabled = false;
        }
    }

    private readFileAsText(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }

    private showGeneratedFiles(): void {
        this.elements.preview.classList.remove("hidden");

        const filesHtml = Array.from(this.state.generatedFiles.entries())
            .map(
                ([filename, content]) => `
        <div style="margin-bottom: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <div style="background: #f8f9fa; padding: 10px; border-bottom: 1px solid #ddd; display: flex; justify-content: between; align-items: center;">
            <strong>📄 ${filename}</strong>
            <button onclick="app.downloadFile('${filename}')" style="margin-left: auto; padding: 5px 10px; background: #007bff; color: white; border: none; border-radius: 3px; cursor: pointer;">
              ⬇️ Download
            </button>
          </div>
          <pre style="margin: 0; padding: 15px; overflow-x: auto; max-height: 300px; font-size: 12px; line-height: 1.4;"><code>${this.escapeHtml(
              content
          )}</code></pre>
        </div>
      `
            )
            .join("");

        this.elements.previewContent.innerHTML = `
      <div style="margin-bottom: 15px; display: flex; gap: 10px;">
        <button onclick="app.downloadAllFiles()" style="padding: 8px 16px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer;">
          📦 Download All as ZIP
        </button>
        <button onclick="app.copyAllToClipboard()" style="padding: 8px 16px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">
          📋 Copy All to Clipboard
        </button>
      </div>
      ${filesHtml}
    `;
    }

    private escapeHtml(text: string): string {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    private hidePreview(): void {
        this.elements.preview.classList.add("hidden");
    }

    private showStatus(
        message: string,
        type: "success" | "error" | "processing"
    ): void {
        this.elements.status.textContent = message;
        this.elements.status.className = `status ${type}`;
        this.elements.status.classList.remove("hidden");
    }

    // Public methods for global access
    public downloadFile(filename: string): void {
        const content = this.state.generatedFiles.get(filename);
        if (content) {
            const blob = new Blob([content], {
                type: "text/plain;charset=utf-8",
            });
            saveAs(blob, filename);
        }
    }

    public async downloadAllFiles(): Promise<void> {
        // For simplicity, we'll create a simple archive format
        // In a real implementation, you might want to use a proper ZIP library
        const archive = Array.from(this.state.generatedFiles.entries())
            .map(([filename, content]) => `=== ${filename} ===\n${content}\n\n`)
            .join("");

        const blob = new Blob([archive], { type: "text/plain;charset=utf-8" });
        saveAs(blob, "java-pojos.txt");
    }

    public async copyAllToClipboard(): Promise<void> {
        const allContent = Array.from(this.state.generatedFiles.values()).join(
            "\n\n"
        );

        try {
            await navigator.clipboard.writeText(allContent);
            this.showStatus("✅ Copied all files to clipboard!", "success");
        } catch (err) {
            console.error("Failed to copy to clipboard:", err);
            this.showStatus("❌ Failed to copy to clipboard", "error");
        }
    }
}

// Initialize the app
const app = new CSVToPojoApp();

// Make app available globally for button clicks
(window as any).app = app;
