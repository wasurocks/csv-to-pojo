# CSV to POJO - Web Generator

🔄 **Client-side CSV to Java POJO generator** - Convert CSV specifications into Java POJOs with validation annotations, all processed in your browser!

**🌐 [Live Demo](https://wasurocks.github.io/csv-to-pojo/)**

## 🚀 Features

-   **Client-side Processing**: All CSV parsing and code generation happens in the browser - no server required
-   **Dynamic Column Mapping**: Smart column detection with manual mapping for any CSV structure
-   **Web Interface**: Modern drag-and-drop file upload with real-time preview
-   **Java POJO Generation**: Creates properly annotated Java classes with Lombok and Bean Validation
-   **Auto-mapping**: Intelligent column detection based on common naming patterns
-   **Docker Support**: Containerized deployment with optimized production and development setups
-   **TypeScript**: Full type safety and modern JavaScript features

## 🏃‍♂️ Quick Start

### Development

```bash
npm install
npm run dev
# Open http://localhost:3000
```

### Production with Docker

```bash
# Build and run production version (static site served via nginx)
docker compose up csv-to-pojo-web -d
# Access at http://localhost:3000
```

### Development with Docker

```bash
# Build and run development version (webpack dev server with hot reload)
docker compose --profile dev up csv-to-pojo-dev
# Access at http://localhost:3001
```

## 📝 Usage

1. **Upload CSV**: Drag and drop or click to select your CSV specification file
2. **Map Columns**: Use the column mapping interface to map your CSV columns to required fields:
    - Columns are automatically mapped using fuzzy matching
    - Manually adjust mappings using the dropdown selectors
    - Required mappings: Field Name and Data Type
3. **Configure**: Set API title, version, and Java package name
4. **Generate**: Click "Generate Java POJOs" to process
5. **Download**: Get individual files or download all as an archive

### CSV Format

Your CSV can have any column structure! The application now features **dynamic column mapping** that allows you to map your CSV columns to the required fields:

#### Required Fields (must be mapped):

-   **Field Name**: Dot-notation field path (e.g., `user.profile.name`)
-   **Data Type**: Data type with optional constraints (e.g., `String (50)`, `Number`)

#### Optional Fields:

-   **M/O/C**: Mandatory (M), Optional (O), or Conditional (C)
-   **Description**: Field description for documentation
-   **Mapping**: Additional mapping information

#### Supported Column Names:

The auto-mapping feature uses fuzzy matching to recognize common variations:

-   Field Name: "Field name", "fieldname", "field_name", "name"
-   Data Type: "Type", "data type", "datatype", "data_type", "field type"
-   M/O/C: "m/o/c", "moc", "mandatory", "required", "optional"
-   Description: "description", "field description", "desc"

### Example

See `examples/request.csv` for a complete example of a payment request specification.

## 🏗️ Architecture

-   **TypeScript + Webpack**: Modern build system with hot reloading
-   **PapaParse**: Client-side CSV parsing
-   **Mustache**: Template-based Java code generation
-   **Docker + nginx**: Production-ready containerized deployment

## 📋 Scripts

```bash
npm run dev        # Development server
npm run build      # Production build
npm test           # Run test suite
npm run lint       # Code quality check
npm run type-check # TypeScript validation
```

## 🤝 Contributing

1. Follow TypeScript and ESLint conventions
2. Add tests for new features
3. Ensure Docker builds pass
4. Update documentation as needed

## 📜 License

MIT License - see LICENSE file for details.
