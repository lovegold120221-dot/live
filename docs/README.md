# Eburon AI Live Audio API Documentation

This directory contains the complete API documentation for the Eburon AI Live Audio system.

## Files

- `index.html` - Interactive Swagger UI documentation
- `README.md` - This file

## Accessing the Documentation

### Method 1: Direct Access
Open `docs/index.html` in your browser to view the interactive API documentation.

### Method 2: From Main Application
1. Open the main application (`index.html`)
2. Click on the API Documentation link (if available)
3. Navigate to the `/docs` directory

## API Endpoints

The Translation Service API provides the following endpoints:

### Status & Health
- `GET /api/status` - Get connection status and statistics
- `GET /api/health` - Health check endpoint

### Translations
- `GET /api/translations` - Get translation history with pagination

### Configuration
- `GET /api/config` - Get current configuration
- `PUT /api/config` - Update configuration

### Languages
- `GET /api/languages` - Get supported languages (80+ languages)

## Features

### Interactive Testing
- **Try it out** functionality for all endpoints
- **Live API status** indicator
- **Request/Response examples** for every endpoint
- **Real-time data** from your translation service

### Documentation
- **OpenAPI 3.0.3** specification
- **Complete schema definitions**
- **Error handling examples**
- **Authentication support** (ready for API keys)

## Usage

1. **View Documentation**: Open `docs/index.html`
2. **Test Endpoints**: Click "Try it out" → "Execute"
3. **View Responses**: See real data from your translation service
4. **Monitor Status**: Check connection status in real-time

## Integration

The documentation integrates seamlessly with your JavaScript API server:
- **Live Data**: Actual translation history and configuration
- **Real-time Status**: Current connection state
- **Interactive Testing**: Test API calls directly from the UI

## Support

For questions or issues with the API documentation:
- Check the interactive examples in the Swagger UI
- Review the schema definitions
- Test endpoints using the "Try it out" feature

---

**Translation Service API**  
Real-time audio translation with Google Gemini Live API
