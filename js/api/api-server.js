/**
 * JavaScript-based API Server for Eburon AI Live Audio
 * Handles OpenAPI specification, connection status, and data tracking
 */

class EburonAILiveAudioServer {
    constructor() {
        this.serverData = {
            running: false,
            startTime: null,
            version: "1.0.0"
        };
        
        this.connectionData = {
            isConnected: false,
            connectionTime: null,
            lastActivity: null,
            totalSessions: 0,
            messagesExchanged: 0,
            websocketUrl: null,
            model: "models/gemini-2.5-flash-native-audio-preview-12-2025"
        };
        
        this.translationHistory = [];
        this.maxHistorySize = 100;
        
        this.openApiSpec = {
            openapi: "3.0.3",
            info: {
                title: "Translation Service API",
                description: "Real-time audio translation service using Google Gemini Live API",
                version: "1.0.0"
            },
            paths: {
                "/api/status": {
                    get: {
                        summary: "Get connection status",
                        description: "Retrieve current connection status and statistics",
                        responses: {
                            "200": {
                                description: "Connection status",
                                content: {
                                    "application/json": {
                                        schema: {
                                            type: "object",
                                            properties: {
                                                connected: { type: "boolean" },
                                                connectionTime: { type: "string" },
                                                lastActivity: { type: "string" },
                                                totalSessions: { type: "integer" }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "/api/translations": {
                        get: {
                            summary: "Get translation history",
                            description: "Retrieve recent translation inputs and outputs",
                            responses: {
                                "200": {
                                    description: "Translation history",
                                    content: {
                                        "application/json": {
                                            schema: {
                                                type: "object",
                                                properties: {
                                                    history: {
                                                        type: "array",
                                                        items: {
                                                            type: "object",
                                                            properties: {
                                                                timestamp: { type: "string" },
                                                                input: { type: "string" },
                                                                output: { type: "string" },
                                                                sourceLanguage: { type: "string" },
                                                                targetLanguage: { type: "string" },
                                                                confidence: { type: "number" }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "/api/config": {
                        get: {
                            summary: "Get current configuration",
                            description: "Retrieve current translation configuration",
                            responses: {
                                "200": {
                                    description: "Current configuration",
                                    content: {
                                        "application/json": {
                                            schema: {
                                                type: "object",
                                                properties: {
                                                    voice: { type: "string" },
                                                    sampleRate: { type: "integer" },
                                                    targetLanguage: { type: "string" },
                                                    systemInstruction: { type: "string" },
                                                    temperature: { type: "number" }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    },
                    "/api/languages": {
                        get: {
                            summary: "Get supported languages",
                            description: "Retrieve list of supported languages",
                            responses: {
                                "200": {
                                    description: "Supported languages",
                                    content: {
                                        "application/json": {
                                            schema: {
                                                type: "object",
                                                properties: {
                                                    languages: {
                                                        type: "array",
                                                        items: {
                                                            type: "object",
                                                            properties: {
                                                                code: { type: "string" },
                                                                name: { type: "string" },
                                                                nativeName: { type: "string" }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        };
    }

    // Server control methods - integrate with existing main.js functions
    startServer(autoConnect = false, config = {}) {
        if (this.serverData.running) {
            return { success: false, error: "Server already running" };
        }
        
        this.serverData.running = true;
        this.serverData.startTime = new Date().toISOString();
        
        if (autoConnect && typeof connectToWebsocket === 'function') {
            // Update CONFIG with provided settings before connecting
            if (config.voice && typeof CONFIG !== 'undefined') {
                CONFIG.VOICE.NAME = config.voice;
            }
            if (config.sampleRate && typeof CONFIG !== 'undefined') {
                CONFIG.AUDIO.INPUT_SAMPLE_RATE = config.sampleRate;
                CONFIG.AUDIO.OUTPUT_SAMPLE_RATE = config.sampleRate;
            }
            if (config.targetLanguage && typeof CONFIG !== 'undefined') {
                CONFIG.TRANSLATION.TARGET_LANGUAGE = config.targetLanguage;
            }
            if (config.systemInstruction && typeof CONFIG !== 'undefined') {
                CONFIG.SYSTEM_INSTRUCTION.TEXT = config.systemInstruction;
            }
            
            // Call the existing connect function
            connectToWebsocket();
        }
        
        return { success: true, serverData: this.getServerStatus() };
    }
    
    stopServer() {
        if (!this.serverData.running) {
            return { success: false, error: "Server not running" };
        }
        
        if (typeof disconnectFromWebsocket === 'function') {
            disconnectFromWebsocket();
        }
        
        this.serverData.running = false;
        this.serverData.startTime = null;
        
        return { success: true, serverData: this.getServerStatus() };
    }
    
    getServerStatus() {
        const uptime = this.serverData.startTime ? 
            Date.now() - new Date(this.serverData.startTime).getTime() : 0;
            
        return {
            ...this.serverData,
            uptime: this.formatUptime(uptime),
            connected: this.connectionData.isConnected,
            activeConnections: this.connectionData.isConnected ? 1 : 0,
            config: this.getCurrentConfiguration()
        };
    }
    
    formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        if (seconds < 60) return `${seconds}s`;
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
        return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
    }
    
    // Connection control methods - integrate with existing main.js functions
    connect(config = {}) {
        if (this.connectionData.isConnected) {
            return { success: false, error: "Already connected" };
        }
        
        // Update CONFIG with provided settings before connecting
        if (config.voice && typeof CONFIG !== 'undefined') {
            CONFIG.VOICE.NAME = config.voice;
        }
        if (config.sampleRate && typeof CONFIG !== 'undefined') {
            CONFIG.AUDIO.INPUT_SAMPLE_RATE = config.sampleRate;
            CONFIG.AUDIO.OUTPUT_SAMPLE_RATE = config.sampleRate;
        }
        if (config.targetLanguage && typeof CONFIG !== 'undefined') {
            CONFIG.TRANSLATION.TARGET_LANGUAGE = config.targetLanguage;
        }
        if (config.systemInstruction && typeof CONFIG !== 'undefined') {
            CONFIG.SYSTEM_INSTRUCTION.TEXT = config.systemInstruction;
        }
        
        // Call the existing connect function
        if (typeof connectToWebsocket === 'function') {
            connectToWebsocket();
        }
        
        // Set connection data based on actual connection state
        if (typeof CONFIG !== 'undefined' && CONFIG.API) {
            this.connectionData.websocketUrl = 
                `${CONFIG.API.BASE_URL}/${CONFIG.API.VERSION}/GenerativeService.BidiGenerateContent?key=${CONFIG.API.KEY}`;
            this.connectionData.model = CONFIG.API.MODEL_NAME;
        }
        
        return { success: true, connectionData: this.getConnectionStatus() };
    }
    
    disconnect() {
        if (!this.connectionData.isConnected) {
            return { success: false, error: "Not connected" };
        }
        
        // Call the existing disconnect function
        if (typeof disconnectFromWebsocket === 'function') {
            disconnectFromWebsocket();
        }
        
        return { success: true, connectionData: this.getConnectionStatus() };
    }
    
    // Update connection status
    updateConnectionStatus(connected) {
        const now = new Date().toISOString();
        
        if (connected && !this.connectionData.isConnected) {
            // Connection established
            this.connectionData.isConnected = true;
            this.connectionData.connectionTime = now;
            this.connectionData.totalSessions++;
        } else if (!connected && this.connectionData.isConnected) {
            // Connection lost
            this.connectionData.isConnected = false;
        }
        
        this.connectionData.lastActivity = now;
    }

    // Add translation to history
    addTranslation(input, output, sourceLanguage, targetLanguage, confidence = null) {
        const translation = {
            timestamp: new Date().toISOString(),
            input: input,
            output: output,
            sourceLanguage: sourceLanguage,
            targetLanguage: targetLanguage,
            confidence: confidence
        };

        this.translationHistory.unshift(translation);
        
        // Limit history size
        if (this.translationHistory.length > this.maxHistorySize) {
            this.translationHistory = this.translationHistory.slice(0, this.maxHistorySize);
        }

        this.updateConnectionStatus(true); // Update activity
        return translation;
    }

    // Get connection status
    getConnectionStatus() {
        const uptime = this.connectionData.isConnected && this.connectionData.connectionTime ? 
            Date.now() - new Date(this.connectionData.connectionTime).getTime() : 0;
            
        return {
            ...this.connectionData,
            uptime: uptime
        };
    }

    // Get translation history
    getTranslationHistory(limit = 50) {
        return this.translationHistory.slice(0, limit);
    }

    // Get current configuration - integrate with actual CONFIG structure
    getCurrentConfiguration() {
        if (typeof CONFIG !== 'undefined') {
            return {
                // API Configuration
                model: CONFIG.API?.MODEL_NAME || 'models/gemini-2.5-flash-native-audio-preview-12-2025',
                
                // Voice Configuration
                voice: CONFIG.VOICE?.NAME || 'Aoede',
                
                // Audio Configuration 
                inputSampleRate: CONFIG.AUDIO?.INPUT_SAMPLE_RATE || 16000,
                outputSampleRate: CONFIG.AUDIO?.OUTPUT_SAMPLE_RATE || 22000,
                bufferSize: CONFIG.AUDIO?.BUFFER_SIZE || 7680,
                channels: CONFIG.AUDIO?.CHANNELS || 1,
                
                // System Configuration
                targetLanguage: CONFIG.TRANSLATION?.TARGET_LANGUAGE || 'auto',
                systemInstruction: CONFIG.SYSTEM_INSTRUCTION?.TEXT || '',
                temperature: 0.3, // This is hardcoded in main.js connectToWebsocket
                
                // API Details (for reference)
                baseUrl: CONFIG.API?.BASE_URL,
                version: CONFIG.API?.VERSION,
                apiKey: CONFIG.API?.KEY ? '***' + CONFIG.API.KEY.slice(-4) : null
            };
        }
        
        return {
            model: 'models/gemini-2.5-flash-native-audio-preview-12-2025',
            voice: 'Aoede',
            inputSampleRate: 16000,
            outputSampleRate: 22000,
            bufferSize: 7680,
            channels: 1,
            targetLanguage: 'auto',
            systemInstruction: '',
            temperature: 0.3
        };
    }

    // Get supported languages
    getSupportedLanguages() {
        return [
            { code: 'auto', name: 'Auto-detect', nativeName: 'Auto-detect' },
            { code: 'en', name: 'English', nativeName: 'English' },
            { code: 'es', name: 'Spanish', nativeName: 'Español' },
            { code: 'fr', name: 'French', nativeName: 'Français' },
            { code: 'de', name: 'German', nativeName: 'Deutsch' },
            { code: 'it', name: 'Italian', nativeName: 'Italiano' },
            { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
            { code: 'ru', name: 'Russian', nativeName: 'Русский' },
            { code: 'zh', name: 'Chinese (Mandarin)', nativeName: '中文' },
            { code: 'ja', name: 'Japanese', nativeName: '日本語' },
            { code: 'ko', name: 'Korean', nativeName: '한국어' },
            { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
            { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
            { code: 'th', name: 'Thai', nativeName: 'ไทย' },
            { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
            { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia' },
            { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu' },
            { code: 'tl', name: 'Filipino (Tagalog)', nativeName: 'Filipino' },
            { code: 'nl', name: 'Dutch', nativeName: 'Nederlands' },
            { code: 'sv', name: 'Swedish', nativeName: 'Svenska' },
            { code: 'no', name: 'Norwegian', nativeName: 'Norsk' },
            { code: 'da', name: 'Danish', nativeName: 'Dansk' },
            { code: 'fi', name: 'Finnish', nativeName: 'Suomi' },
            { code: 'pl', name: 'Polish', nativeName: 'Polski' },
            { code: 'cs', name: 'Czech', nativeName: 'Čeština' },
            { code: 'sk', name: 'Slovak', nativeName: 'Slovenčina' },
            { code: 'hu', name: 'Hungarian', nativeName: 'Magyar' },
            { code: 'ro', name: 'Romanian', nativeName: 'Română' },
            { code: 'bg', name: 'Bulgarian', nativeName: 'Български' },
            { code: 'hr', name: 'Croatian', nativeName: 'Hrvatski' },
            { code: 'sr', name: 'Serbian', nativeName: 'Српски' },
            { code: 'sl', name: 'Slovenian', nativeName: 'Slovenščina' },
            { code: 'et', name: 'Estonian', nativeName: 'Eesti' },
            { code: 'lv', name: 'Latvian', nativeName: 'Latviešu' },
            { code: 'lt', name: 'Lithuanian', nativeName: 'Lietuvių' },
            { code: 'uk', name: 'Ukrainian', nativeName: 'Українська' },
            { code: 'el', name: 'Greek', nativeName: 'Ελληνικά' },
            { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
            { code: 'he', name: 'Hebrew', nativeName: 'עברית' },
            { code: 'fa', name: 'Persian (Farsi)', nativeName: 'فارسی' },
            { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
            { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
            { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
            { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
            { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
            { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
            { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
            { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
            { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
            { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
            { code: 'si', name: 'Sinhala', nativeName: 'සිංහල' },
            { code: 'my', name: 'Myanmar (Burmese)', nativeName: 'မြန်မာ' },
            { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ' },
            { code: 'lo', name: 'Lao', nativeName: 'ລາວ' },
            { code: 'ka', name: 'Georgian', nativeName: 'ქართული' },
            { code: 'am', name: 'Amharic', nativeName: 'አማርኛ' },
            { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili' },
            { code: 'zu', name: 'Zulu', nativeName: 'isiZulu' },
            { code: 'af', name: 'Afrikaans', nativeName: 'Afrikaans' },
            { code: 'is', name: 'Icelandic', nativeName: 'Íslenska' },
            { code: 'mt', name: 'Maltese', nativeName: 'Malti' },
            { code: 'cy', name: 'Welsh', nativeName: 'Cymraeg' },
            { code: 'ga', name: 'Irish', nativeName: 'Gaeilge' },
            { code: 'gd', name: 'Scottish Gaelic', nativeName: 'Gàidhlig' },
            { code: 'eu', name: 'Basque', nativeName: 'Euskara' },
            { code: 'ca', name: 'Catalan', nativeName: 'Català' },
            { code: 'gl', name: 'Galician', nativeName: 'Galego' },
            { code: 'oc', name: 'Occitan', nativeName: 'Occitan' }
        ];
    }

    // Handle API requests (simulated endpoint handler)
    handleRequest(endpoint, method = 'GET', data = null) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                try {
                    let response;
                    
                    switch (endpoint) {
                        case '/openapi.json':
                            response = this.openApiSpec;
                            break;
                            
                        // Server Control endpoints
                        case '/api/server/start':
                            if (method === 'POST') {
                                const autoConnect = data?.autoConnect || false;
                                const config = data?.config || {};
                                response = this.startServer(autoConnect, config);
                            } else {
                                reject(new Error('Method not allowed'));
                                return;
                            }
                            break;
                            
                        case '/api/server/stop':
                            if (method === 'POST') {
                                response = this.stopServer();
                            } else {
                                reject(new Error('Method not allowed'));
                                return;
                            }
                            break;
                            
                        case '/api/server/status':
                            response = this.getServerStatus();
                            break;
                            
                        // Connection Management endpoints
                        case '/api/connection/connect':
                            if (method === 'POST') {
                                const config = data?.config || {};
                                response = this.connect(config);
                            } else {
                                reject(new Error('Method not allowed'));
                                return;
                            }
                            break;
                            
                        case '/api/connection/disconnect':
                            if (method === 'POST') {
                                response = this.disconnect();
                            } else {
                                reject(new Error('Method not allowed'));
                                return;
                            }
                            break;
                            
                        case '/api/connection/status':
                        case '/api/status':
                            response = this.getConnectionStatus();
                            break;
                            
                        case '/api/translations':
                            const limit = data?.limit || 50;
                            response = { history: this.getTranslationHistory(limit) };
                            break;
                            
                        case '/api/config':
                            response = this.getCurrentConfiguration();
                            break;
                            
                        case '/api/languages':
                            response = { languages: this.getSupportedLanguages() };
                            break;
                            
                        case '/api/health':
                            response = {
                                status: 'healthy',
                                timestamp: new Date().toISOString(),
                                version: this.serverData.version,
                                uptime: this.formatUptime(
                                    this.serverData.startTime ? 
                                    Date.now() - new Date(this.serverData.startTime).getTime() : 0
                                ),
                                apiStatus: {
                                    gemini: this.connectionData.isConnected ? 'connected' : 'disconnected',
                                    websocket: this.connectionData.isConnected ? 'active' : 'inactive'
                                }
                            };
                            break;
                            
                        default:
                            reject(new Error(`Endpoint not found: ${endpoint}`));
                            return;
                    }
                    
                    resolve({
                        status: 200,
                        data: response,
                        timestamp: new Date().toISOString()
                    });
                    
                } catch (error) {
                    reject({
                        status: 500,
                        error: error.message,
                        timestamp: new Date().toISOString()
                    });
                }
            }, 10); // Simulate network delay
        });
    }

    // Export data as JSON
    exportData() {
        return {
            connectionData: this.getConnectionStatus(),
            translationHistory: this.getTranslationHistory(),
            configuration: this.getCurrentConfiguration(),
            languages: this.getSupportedLanguages(),
            exportTime: new Date().toISOString()
        };
    }

    // Clear translation history
    clearHistory() {
        this.translationHistory = [];
        this.connectionData.totalSessions = 0;
        this.connectionData.connectionTime = null;
        this.connectionData.lastActivity = null;
    }
}

// Initialize the API server and make it globally available
const eburonAIServer = new EburonAILiveAudioServer();
window.eburonAIServer = eburonAIServer;

// Keep backward compatibility
window.translationAPIServer = eburonAIServer;

// Initialize connection status from main app if already connected
function initializeConnectionStatus() {
  // Check if main app is already connected
  if (typeof isConnected !== 'undefined' && isConnected) {
    eburonAIServer.updateConnectionStatus(true);
  }
}

// Initialize after a short delay to ensure main app is loaded
setTimeout(initializeConnectionStatus, 100);

if (typeof module !== 'undefined' && module.exports) {
    module.exports = EburonAILiveAudioServer;
}
