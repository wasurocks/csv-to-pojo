# CSV to POJO - Web Generator

🔄 **Client-side CSV to Java POJO generator** - Convert CSV specifications into Java POJOs with validation annotations, all processed in your browser!

## 🚀 Features

- **Client-side Processing**: All CSV parsing and code generation happens in the browser - no server required
- **Web Interface**: Modern drag-and-drop file upload with real-time preview
- **Java POJO Generation**: Creates properly annotated Java classes with Lombok and Bean Validation
- **Docker Support**: Containerized deployment with nginx
- **TypeScript**: Full type safety and modern JavaScript features

## 🏃‍♂️ Quick Start

### Development
```bash
npm install
npm run dev
# Open http://localhost:3000
```

### Production with Docker
```bash
docker-compose up -d
# Access at http://localhost:3000
```

## 📝 Usage

1. **Upload CSV**: Drag and drop or click to select your CSV specification file
2. **Configure**: Set API title, version, and Java package name  
3. **Generate**: Click "Generate Java POJOs" to process
4. **Download**: Get individual files or download all as an archive

### CSV Format

Your CSV should have these columns:
- `Field name`: Dot-notation field path (e.g., `user.profile.name`)
- `Type`: Data type with optional constraints (e.g., `String (50)`, `Number`)
- `M/O/C`: Mandatory (M), Optional (O), or Conditional (C)
- `Description`: Field description for documentation

### Example

See `examples/request.csv` for a complete example of a payment request specification.

## 🏗️ Architecture

- **TypeScript + Webpack**: Modern build system with hot reloading
- **PapaParse**: Client-side CSV parsing
- **Mustache**: Template-based Java code generation
- **Docker + nginx**: Production-ready containerized deployment

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
