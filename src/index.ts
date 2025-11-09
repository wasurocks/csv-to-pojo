import { buildOpenAPIFromCSVWithMapping } from "./csvParser";
import { generateJavaCode } from "./codeGenerator";
import { saveAs } from "file-saver";
import Papa from "papaparse";

interface SchemaFieldMapping {
    schemaField: string;
    csvColumn: string;
    label: string;
    required: boolean;
}

interface AppState {
    csvFile: File | null;
    csvHeaders: string[];
    schemaFieldMappings: SchemaFieldMapping[];
    isProcessing: boolean;
    generatedFiles: Map<string, string>;
}

class CSVToPojoApp {
    private state: AppState = {
        csvFile: null,
        csvHeaders: [],
        schemaFieldMappings: [],
        isProcessing: false,
        generatedFiles: new Map(),
    };

    private readonly requiredSchemaFields = [
        { value: "fieldName", label: "Field Name", required: true },
        { value: "type", label: "Data Type", required: true },
        {
            value: "mandatory",
            label: "M/O/C (Mandatory/Optional/Conditional)",
            required: false,
        },
        { value: "description", label: "Description", required: false },
        { value: "sampleValue", label: "Sample Value", required: false },
    ];

    private elements: {
        uploadSection: HTMLElement;
        csvFileInput: HTMLInputElement;
        generateBtn: HTMLButtonElement;
        status: HTMLElement;
        preview: HTMLElement;
        previewContent: HTMLElement;
        baseModelName: HTMLInputElement;
        modelPackage: HTMLInputElement;
        columnMapping: HTMLElement;
        mappingContent: HTMLElement;
        autoMapBtn: HTMLButtonElement;
        resetMappingBtn: HTMLButtonElement;
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
            baseModelName: document.getElementById(
                "baseModelName"
            ) as HTMLInputElement,
            modelPackage: document.getElementById(
                "modelPackage"
            ) as HTMLInputElement,
            columnMapping: document.getElementById("columnMapping")!,
            mappingContent: document.getElementById("mappingContent")!,
            autoMapBtn: document.getElementById(
                "autoMapBtn"
            ) as HTMLButtonElement,
            resetMappingBtn: document.getElementById(
                "resetMappingBtn"
            ) as HTMLButtonElement,
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

        // Auto-map button
        this.elements.autoMapBtn.addEventListener("click", () => {
            this.autoMapColumns();
        });

        // Reset mapping button
        this.elements.resetMappingBtn.addEventListener("click", () => {
            this.resetColumnMapping();
        });
    }

    private async handleFileSelection(file: File): Promise<void> {
        if (!file.name.toLowerCase().endsWith(".csv")) {
            this.showStatus("Please select a CSV file", "error");
            return;
        }

        try {
            this.state.csvFile = file;

            const csvContent = await this.readFileAsText(file);
            await this.parseCsvHeaders(csvContent);

            this.showColumnMappingUI();
            this.autoMapColumns();

            this.elements.generateBtn.disabled = false;
            this.showStatus(
                `File selected: ${file.name} - Review column mapping below`,
                "success"
            );
            this.hidePreview();
        } catch (error) {
            console.error("Error processing CSV file:", error);
            this.showStatus("Error reading CSV file", "error");
        }
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

            // Create column mapping object from schema field mappings
            const columnMapping: { [csvColumn: string]: string } = {};
            this.state.schemaFieldMappings.forEach((mapping) => {
                if (mapping.csvColumn && mapping.csvColumn.trim()) {
                    columnMapping[mapping.csvColumn] = mapping.schemaField;
                }
            });

            // Validate required mappings
            const requiredMappings = this.state.schemaFieldMappings.filter(
                (m) => m.required
            );
            const missingRequired = requiredMappings.filter(
                (m) => !m.csvColumn || !m.csvColumn.trim()
            );

            if (missingRequired.length > 0) {
                const missingLabels = missingRequired
                    .map((m) => m.label)
                    .join(", ");
                throw new Error(`Required mappings missing: ${missingLabels}`);
            }

            // Column mapping validation is now handled in the CSV parser

            // Generate OpenAPI spec with column mappings
            const openApiSpec = buildOpenAPIFromCSVWithMapping(
                csvContent,
                columnMapping,
                this.elements.baseModelName.value
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

            const errorMessage = (error as Error).message;
            let displayMessage = errorMessage;

            // Enhance error messages for better user experience
            if (errorMessage.includes("CSV structure validation failed")) {
                displayMessage = `❌ CSV Format Issue:\n\n${errorMessage
                    .replace("CSV structure validation failed:", "")
                    .trim()}`;
            } else if (errorMessage.includes("CSV parsing failed")) {
                displayMessage = `❌ CSV Parsing Error:\n\n${errorMessage}\n\nPlease check that your CSV file is properly formatted with valid headers and data.`;
            } else if (errorMessage.includes("Cannot find module")) {
                displayMessage = `❌ System Error:\n\nAn internal error occurred. Please try refreshing the page.`;
            } else {
                displayMessage = `❌ Processing Failed:\n\n${errorMessage}`;
            }

            this.showDetailedError(displayMessage);
        } finally {
            this.state.isProcessing = false;
            this.elements.generateBtn.disabled = false;
        }
    }

    private async parseCsvHeaders(csvContent: string): Promise<void> {
        const parseResult = Papa.parse(csvContent, {
            header: true,
            preview: 1,
            skipEmptyLines: true,
            transformHeader: (header: string) =>
                header.trim().replace(/^\uFEFF/, ""),
        });

        if (parseResult.errors.length > 0) {
            throw new Error(
                `CSV parsing failed: ${parseResult.errors[0].message}`
            );
        }

        // Filter out empty or whitespace-only headers
        const allHeaders = parseResult.meta.fields || [];
        this.state.csvHeaders = allHeaders.filter(
            (header) => header && header.trim().length > 0
        );

        // Initialize schema field mappings (user-driven approach)
        this.state.schemaFieldMappings = this.requiredSchemaFields.map(
            (field) => ({
                schemaField: field.value,
                csvColumn: "", // No default selection
                label: field.label,
                required: field.required,
            })
        );
    }

    private showColumnMappingUI(): void {
        this.elements.columnMapping.classList.remove("hidden");
        this.renderMappingRows();
    }

    private renderMappingRows(): void {
        this.elements.mappingContent.innerHTML = "";

        // Use the new schema-field-centric approach
        this.state.schemaFieldMappings.forEach((mapping, index) => {
            const row = this.createSchemaFieldMappingRow(mapping, index);
            this.elements.mappingContent.appendChild(row);
        });
    }

    private createSchemaFieldMappingRow(
        mapping: SchemaFieldMapping,
        index: number
    ): HTMLElement {
        const row = document.createElement("div");
        row.className = "mapping-grid";

        // CSV column selector (left side)
        const select = document.createElement("select");
        select.className = "csv-select";
        select.addEventListener("change", (e) => {
            const target = e.target as HTMLSelectElement;
            this.updateSchemaFieldMapping(index, target.value);
        });

        // Add "Not mapped" option
        const notMappedOption = document.createElement("option");
        notMappedOption.value = "";
        notMappedOption.textContent = mapping.required
            ? "Select CSV column..."
            : "Not mapped";
        notMappedOption.selected = mapping.csvColumn === "";
        select.appendChild(notMappedOption);

        // Add available CSV columns
        this.state.csvHeaders.forEach((header) => {
            const option = document.createElement("option");
            option.value = header;
            option.textContent = header;
            option.selected = header === mapping.csvColumn;
            select.appendChild(option);
        });

        const arrowDiv = document.createElement("div");
        arrowDiv.className = "mapping-arrow";
        arrowDiv.textContent = "→";

        // Program field name (right side - what we need)
        const programFieldDiv = document.createElement("div");
        programFieldDiv.className = "program-field";
        programFieldDiv.textContent = mapping.label;
        if (mapping.required) {
            programFieldDiv.classList.add("required");
            programFieldDiv.textContent += " *";
        }

        row.appendChild(select);
        row.appendChild(arrowDiv);
        row.appendChild(programFieldDiv);

        return row;
    }

    private updateSchemaFieldMapping(index: number, csvColumn: string): void {
        this.state.schemaFieldMappings[index].csvColumn = csvColumn;
        this.renderMappingRows();
    }

    // Basic string similarity based on Levenshtein distance
    private getStringSimilarity(a: string, b: string): number {
        const longer = a.length > b.length ? a : b;
        const shorter = a.length > b.length ? b : a;
        const longerLength = longer.length;
        if (longerLength === 0) {
            return 1.0;
        }

        const distance = this.getEditDistance(longer, shorter);
        return (longerLength - distance) / longerLength;
    }

    private getEditDistance(a: string, b: string): number {
        const matrix: number[][] = [];

        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[b.length][a.length];
    }

    private normalizeColumnName(name: string): string {
        return name.toLowerCase().trim().replace(/[\s_]+/g, "");
    }
    private autoMapColumns(): void {
        const fieldMappings = {
            fieldName: ["field name", "fieldname", "field_name", "name"],
            type: ["type", "data type", "datatype", "data_type", "field type"],
            mandatory: ["m/o/c", "moc", "mandatory", "required", "optional"],
            description: [
                "description",
                "field description",
                "fielddescription",
                "field_description",
                "desc",
            ],
            mapping: ["mapping", "map", "source", "target"],
        } as const;

        const threshold = 0.6; // similarity threshold

        // Auto-map schema fields to CSV columns using fuzzy matching
        this.state.schemaFieldMappings.forEach((schemaMapping) => {
            const variations = fieldMappings[
                schemaMapping.schemaField as keyof typeof fieldMappings
            ];

            if (!variations) {
                return;
            }

            let bestMatch = "";
            let bestScore = 0;

            for (const header of this.state.csvHeaders) {
                const normalizedHeader = this.normalizeColumnName(header);

                variations.forEach((variation) => {
                    const score = this.getStringSimilarity(
                        normalizedHeader,
                        this.normalizeColumnName(variation)
                    );
                    if (score > bestScore) {
                        bestScore = score;
                        bestMatch = header;
                    }
                });
            }

            schemaMapping.csvColumn = bestScore >= threshold ? bestMatch : "";
        });

        this.renderMappingRows();
        this.showStatus(
            "Auto-mapping completed! Please review and adjust as needed.",
            "success"
        );
    }

    private resetColumnMapping(): void {
        // Reset schema field mappings
        this.state.schemaFieldMappings.forEach((mapping) => {
            mapping.csvColumn = "";
        });

        this.renderMappingRows();
        this.showStatus("Column mapping reset.", "success");
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

    private showDetailedError(message: string): void {
        // Create a more detailed error display
        this.elements.status.innerHTML = `
            <div style="text-align: left;">
                <strong style="color: #721c24;">Processing Error</strong>
                <pre style="white-space: pre-wrap; margin-top: 10px; font-family: monospace; font-size: 12px; background: rgba(0,0,0,0.05); padding: 10px; border-radius: 4px; overflow-x: auto;">${this.escapeHtml(
                    message
                )}</pre>
                <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; font-size: 14px;">
                    <strong>💡 Common Solutions:</strong>
                    <ul style="margin: 5px 0; padding-left: 20px;">
                        <li>Ensure your CSV has columns: "Field name", "Type", "M/O/C", "Description"</li>
                        <li>Remove any empty rows or columns at the beginning</li>
                        <li>Check that field names use dot notation (e.g., "user.profile.name")</li>
                        <li>Verify that data types are valid (String, Number, Date, Boolean, etc.)</li>
                    </ul>
                </div>
            </div>
        `;
        this.elements.status.className = "status error";
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

    private jszipPromise: Promise<any> | null = null;

    private async loadJSZip(): Promise<any> {
        if (!this.jszipPromise) {
            this.jszipPromise = new Promise((resolve, reject) => {
                const script = document.createElement("script");
                script.src =
                    "https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js";
                script.onload = () => resolve((window as any).JSZip);
                script.onerror = () => reject(new Error("Failed to load JSZip"));
                document.head.appendChild(script);
            });
        }
        return this.jszipPromise;
    }

    public async downloadAllFiles(): Promise<void> {
        const JSZip = await this.loadJSZip();
        const zip = new JSZip();
        for (const [filename, content] of this.state.generatedFiles.entries()) {
            zip.file(filename, content);
        }
        const blob = await zip.generateAsync({ type: "blob" });
        saveAs(blob, "java-pojos.zip");
    }
}

// Initialize the app
const app = new CSVToPojoApp();

// Make app available globally for button clicks
(window as any).app = app;
