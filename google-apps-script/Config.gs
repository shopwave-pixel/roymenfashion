/**
 * ============================================================================
 *               ROY MEN - ENTERPRISE ORDER MANAGEMENT SYSTEM
 * ============================================================================
 * 
 * FILE: Config.gs
 * ROLE: Centralized Configuration & Enterprise Constants
 * DESIGN THEME: Quiet Luxury (Black, White, Charcoal & Champagne Gold Accent)
 * PLATFORM: Google Apps Script (V8 Engine Compatible)
 * AUTHOR: Senior Google Apps Script Platform Architect
 * 
 * DESCRIPTION:
 * This file serves as the single source of truth (SSOT) for all settings,
 * constants, configurations, sheet schemas, validation lists, themes,
 * and service limits. This architecture ensures high modularity, scalability,
 * and maintains clean code isolation.
 * ============================================================================
 */

/**
 * @namespace CONFIG
 * @description Master configuration object containing system-wide immutable constants.
 */
var CONFIG = {
  // ============================================================================
  // 1. SYSTEM METADATA & CORE SETTINGS
  // ============================================================================
  PROJECT_NAME: "ROY MEN Enterprise Order Management System",
  VERSION: "1.0.0-ENTERPRISE",
  TIMEZONE: "Asia/Dhaka", // Bangladesh Standard Time (BST)
  LOCALE: "en-US",
  
  // Performance & Concurrency Limits
  LOCK_TIMEOUT_MS: 30000,      // Safe lock window to handle high concurrent drop sales (30 seconds)
  CACHE_DEFAULT_TTL: 300,      // Default CacheService expiration in seconds (5 minutes)
  MAX_RETRIES: 5,             // Number of retries for external HTTP requests
  BACKOFF_BASE_MS: 1000,       // Base delay in milliseconds for exponential backoff retry

  // ============================================================================
  // 2. CORE GOOGLE SHEETS NAMES MAPPING
  // ============================================================================
  SHEETS: {
    DASHBOARD: "Dashboard",
    ORDERS: "Orders",
    REPORTS: "Reports",
    PRODUCTS: "Products",
    CUSTOMERS: "Customers",
    ORDER_HISTORY: "Order History",
    PAYMENT_HISTORY: "Payment History",
    AUDIT_LOG: "Audit Log",
    SETTINGS: "Settings"
  },

  // ============================================================================
  // 3. ALLOWED STATES & VALIDATION LISTS
  // ============================================================================
  ORDER_STATUSES: [
    "Pending",
    "Confirmed",
    "Processing",
    "Packed",
    "Shipped",
    "Delivered",
    "Cancelled",
    "Returned"
  ],

  PAYMENT_STATUSES: [
    "Pending",
    "Paid",
    "Failed",
    "Refunded"
  ],

  // ============================================================================
  // 4. STRUCTURED COLUMNS MAPPING and HEADERS SETUP
  // ============================================================================
  HEADERS: {
    ORDERS: [
      "Timestamp",           // Col A (1)  - Record insertion timestamp
      "Order ID",            // Col B (2)  - Primary Key from MongoDB
      "Order Date",          // Col C (3)  - Original placement date
      "Customer Name",       // Col D (4)  - Billing/Shipping Name
      "Phone",               // Col E (5)  - Contact Phone
      "Email",               // Col F (6)  - Customer Email
      "Address",             // Col G (7)  - Physical Shipping Address
      "Division",            // Col H (8)  - Administrative Division
      "District",            // Col I (9)  - District
      "Postal Code",         // Col J (10) - ZIP/Postal Code
      "Payment Method",      // Col K (11) - COD, SSLCommerz, Bkash, etc.
      "Payment Status",      // Col L (12) - Pending, Paid, Failed, Refunded
      "Order Status",        // Col M (13) - Active fulfillment status
      "Products",            // Col N (14) - JSON/String list of products purchased
      "Sizes",               // Col O (15) - Product sizes purchased
      "Colors",              // Col P (16) - Product colors purchased
      "Quantity",            // Col Q (17) - Total items in order
      "Unit Price",          // Col R (18) - Unit price (individual base)
      "Subtotal",            // Col S (19) - Cumulative subtotal (৳)
      "Delivery Charge",     // Col T (20) - Delivery/Shipping Charge (৳)
      "Discount",            // Col U (21) - Discount applied (৳)
      "Grand Total",         // Col V (22) - Net total receivable (৳)
      "Courier Name",        // Col W (23) - Shipping carrier name
      "Tracking Number",     // Col X (24) - Shipment Tracking identifier
      "Tracking URL",        // Col Y (25) - Shipment Tracking redirect hyperlink
      "Notes",               // Col Z (26) - Custom operational annotations
      "Customer IP",         // Col AA (27)- Client IP address
      "Browser"              // Col AB (28)- Client browser User-Agent
    ],
    PRODUCTS: [
      "Product Name",        // Primary Key - Name of product
      "Quantity Sold",       // Total quantity purchased across all orders
      "Revenue",             // Total currency generated by this catalog item
      "First Sold Date",     // Earliest record of sale
      "Last Sold Date",      // Most recent record of sale
      "Average Selling Price",// Derived ASP
      "Best Selling Month"   // Peak sales volume month (YYYY-MM)
    ],
    CUSTOMERS: [
      "Customer Name",       // Full billing name
      "Phone",               // Unique customer contact phone (Primary Index)
      "Email",               // Contact email
      "First Order Date",    // Onboarding transaction timestamp
      "Last Order Date",     // Most recent interaction timestamp
      "Lifetime Orders",     // Cumulative transaction frequency
      "Lifetime Spending",   // Cumulative net checkout amount
      "Average Order Value"  // Lifetime Spending / Lifetime Orders
    ],
    ORDER_HISTORY: [
      "Timestamp",           // Date of status adjustment
      "Order ID",            // Affected order identification reference
      "Previous Status",     // State transition source
      "New Status",          // State transition destination
      "Changed By"           // Agent email or system process responsible
    ],
    PAYMENT_HISTORY: [
      "Timestamp",           // Date of financial update
      "Order ID",            // Affected order identification reference
      "Previous Status",     // State transition source
      "New Status",          // State transition destination
      "Changed By"           // Agent email or system process responsible
    ],
    AUDIT_LOG: [
      "Timestamp",           // Event execution timestamp
      "Event Type",          // Class of event (e.g., Security, Data, Sync)
      "Order ID",            // Contextual order referenced (if applicable)
      "Details"              // Comprehensive diagnostic trail text
    ]
  },

  // ============================================================================
  // 5. VISUAL IDENTITY SYSTEM (THEME CONSTANTS)
  // ============================================================================
  THEME: {
    // Brand Colors
    PRIMARY_DARK: "#0F0F0F",  // Absolute Slate/Black for structural prominence
    ACCENT_GOLD: "#C5A880",   // Champagne Gold accents for subtle luxury
    BG_LIGHT_ZEBRA: "#F9F9F9",// Off-white/zinc zebra alternating color
    BORDER_LIGHT: "#EAEAEA",  // High-end minimalist borders
    TEXT_MUTED: "#767676",    // Refined charcoal grey for secondary texts
    TEXT_LIGHT: "#FFFFFF",    // Clear white
    
    // Extended Semantic Colors
    COLOR_SUCCESS: "#1E5A27", // Emerald Hunter Green
    COLOR_INFO: "#2A4E77",    // Deep Sapphire Navy
    COLOR_WARNING: "#C46210", // Teracotta Ochre
    COLOR_ERROR: "#902020",   // Burgundy Wine
    COLOR_BG_ALERT: "#FAF5EF",// Warm Linen Base

    // Status Highlights
    STATUS: {
      PENDING:     { BG: "#FAF5EF", TEXT: "#8B6F4F" }, // Soft Warm Sand
      CONFIRMED:   { BG: "#F0F4F8", TEXT: "#2A4E77" }, // Crisp Classic Navy
      PROCESSING:  { BG: "#FAF1E6", TEXT: "#C46210" }, // Muted Teracotta
      PACKED:      { BG: "#F3EEFA", TEXT: "#5E3B8D" }, // Royal Lavender
      SHIPPED:     { BG: "#EEFAF7", TEXT: "#1B5E50" }, // Jade Slate
      DELIVERED:   { BG: "#EDF7ED", TEXT: "#1E5A27" }, // Hunter Green tint
      CANCELLED:   { BG: "#FAF0F0", TEXT: "#902020" }, // Burgundy Ash
      RETURNED:    { BG: "#F5F5F5", TEXT: "#555555" }  // Ash Neutral
    },
    
    // Payment States
    PAYMENT: {
      PENDING:     { BG: "#FAF0F0", TEXT: "#902020" }, // Burgundy
      PAID:        { BG: "#EDF7ED", TEXT: "#1E5A27" }, // Hunter Green
      FAILED:      { BG: "#FAF0F0", TEXT: "#902020" }, // Burgundy
      REFUNDED:    { BG: "#F5F5F5", TEXT: "#555555" }  // Ash
    }
  },

  // ============================================================================
  // 6. DYNAMIC DASHBOARD COORDINATES & SEARCH CONSOLE
  // ============================================================================
  DASHBOARD_COORDS: {
    TITLE_RANGE: "A1:H1",
    SUBTITLE_RANGE: "A2:H2",
    KPI_GRID: {
      REVENUE:       { LABEL: "A4:B4", VALUE: "A5:B5", FORMULA: "=SUM(Orders!V2:V)" },
      ORDERS:        { LABEL: "D4:E4", VALUE: "D5:E5", FORMULA: "=COUNTA(Orders!B2:B)" },
      CUSTOMERS:     { LABEL: "A7:B7", VALUE: "A8:B8", FORMULA: "=COUNTA(Customers!B2:B)" },
      AOV:           { LABEL: "D7:E7", VALUE: "D8:E8", FORMULA: "=AVERAGE(Orders!V2:V)" }
    },
    SEARCH_CONSOLES: {
      INPUT: "G4",
      BUTTON_SEARCH: "G5",
      BUTTON_CLEAR: "H5"
    }
  },

  // ============================================================================
  // 7. EMAIL CONFIGURATION
  // ============================================================================
  EMAIL_CONFIG: {
    PROVIDER: "GmailApp",                           // Active sender service ("GmailApp" or "MailApp")
    SENDER_NAME: "ROY MEN Concierge",              // Brand alias shown on recipient inboxes
    SENDER_EMAIL: "concierge@roymen.com",          // Outbound sender mask (if authorized alias exists)
    ADMIN_EMAIL: "admin@roymen.com",                // Dedicated administration notifier inbox
    OTP_EXPIRY_MS: 300000,                          // Time-to-Live for generated security OTP (5 Minutes)
    OTP_COOLDOWN_MS: 60000,                         // Time limits between consecutive OTP dispatches (1 Minute)
    MAX_OTP_REQUESTS_PER_HOUR: 5,                   // Strict rate limit on OTP dispatches per email
    MAX_OTP_VERIFICATION_ATTEMPTS: 3                // Maximum incorrect tries before lock out
  },

  // ============================================================================
  // 8. API CONFIGURATION (COMMUNICATION METRICS)
  // ============================================================================
  API_CONFIG: {
    VERSION: "v1",                                  // API endpoints major routing version
    BASE_PATH: "/api/v1",                           // URI base route matching Railway endpoints
    HEADERS: {
      API_KEY: "X-ROYMEN-API-KEY",                  // Inbound authentication header
      SIGNATURE: "X-ROYMEN-SIGNATURE",              // Webhook integrity checksum header
      TIMESTAMP: "X-ROYMEN-TIMESTAMP"               // Replay attack validation timestamp header
    },
    TIMEOUT_MS: 15000,                              // Maximum await limit for outbound requests (15 seconds)
    RETRY_COUNT: 3,                                 // Maximum retries for non-fatal HTTP connections
    RETRY_DELAY_MS: 2000                            // Wait window before initiating automatic retry backoff
  },

  // ============================================================================
  // 9. QUEUE CONFIGURATION (RECOVERY / ASYNC RESILIENCE)
  // ============================================================================
  QUEUE: {
    FAILED_EMAIL: "queue_failed_emails",            // Storage cache key/sheet alias for unsent emails
    FAILED_SYNC: "queue_failed_syncs",              // Storage cache key/sheet alias for pending DB syncs
    RETRY_INTERVAL_MINUTES: 5,                      // Frequency of execution for failed task queue runner
    SIZE_LIMIT: 500                                 // Maximum buffer limit to avoid transaction throttling
  },

  // ============================================================================
  // 10. CACHE CONFIGURATION
  // ============================================================================
  CACHE: {
    DASHBOARD_KEY: "CACHE_KPI_DASHBOARD_SUMMARY",   // Cache key for primary dashboard cards state
    CUSTOMER_PREFIX: "CACHE_CUST_INDEX_",           // Base tag for fast customer profile lookup cache
    PRODUCT_PREFIX: "CACHE_PROD_INDEX_",             // Base tag for catalog metrics compilation cache
    SETTINGS_KEY: "CACHE_SYSTEM_SETTINGS",          // Cache key for global script parameters
    ANALYTICS_KEY: "CACHE_METRICS_ANALYTICS"        // Cache key for pre-calculated revenue statistics
  },

  // ============================================================================
  // 11. SCRIPT PROPERTIES KEYS
  // ============================================================================
  PROPERTIES_KEYS: {
    LAST_SYNC: "PROP_SYS_LAST_SYNC_TIMESTAMP",      // Timestamp of the last successful MongoDB database sync
    LAST_BACKUP: "PROP_SYS_LAST_BACKUP_TIMESTAMP",  // Timestamp of the last successful Google Drive backup
    TOTAL_ORDERS: "PROP_METRIC_TOTAL_ORDERS_COUNT", // Cacheable cumulative order count
    FAILED_REQUESTS: "PROP_METRIC_FAILED_REQ_COUNT",// Failure logs counter for system health monitor
    LAST_DASHBOARD_REFRESH: "PROP_SYS_DASH_REFRESH",// Tracking time of last layout formatting
    CURRENT_VERSION: "PROP_SYS_DEPLOY_VERSION"      // Holds current active engine configuration version
  },

  // ============================================================================
  // 12. AUTOMATIC TRIGGER CONFIGURATION
  // ============================================================================
  TRIGGERS: {
    DASHBOARD_REFRESH_INTERVAL_MIN: 15,             // Auto-refresh layout alignment interval
    RETRY_QUEUE_INTERVAL_MIN: 5,                    // Resubmit fails queue interval
    BACKUP_INTERVAL_HOURS: 24,                      // Automatic CSV/Excel spreadsheet archive schedule
    ANALYTICS_INTERVAL_HOURS: 12                    // Background stats pre-aggregation interval
  },

  // ============================================================================
  // 13. BUSINESS EVENTS CONSTANTS (HOOKS / LOGGING)
  // ============================================================================
  EVENTS: {
    ORDER_CREATED: "EVENT_ORDER_CREATED",           // New sales dispatch trigger
    ORDER_UPDATED: "EVENT_ORDER_UPDATED",           // Operational correction trigger
    ORDER_DELETED: "EVENT_ORDER_DELETED",           // Cancellation / Purge event
    ORDER_STATUS_CHANGED: "EVENT_ORDER_STATUS_CHG", // Transit state transitions trigger
    PAYMENT_STATUS_CHANGED: "EVENT_PAY_STATUS_CHG", // Financial reconciliation trigger
    TRACKING_UPDATED: "EVENT_TRACKING_UPDATED",     // Courier integration trigger
    CUSTOMER_CREATED: "EVENT_CUSTOMER_CREATED",     // First-time purchase onboarding
    CUSTOMER_UPDATED: "EVENT_CUSTOMER_UPDATED"      // Customer profile adjustments
  },

  // ============================================================================
  // 14. COMPREHENSIVE EMAIL TEMPLATES LIST
  // ============================================================================
  TEMPLATES: {
    WELCOME: "TEMPLATE_WELCOME_VIP",               // Exclusive client registration email
    OTP: "TEMPLATE_SECURITY_OTP",                   // General authorization OTP code
    VERIFICATION: "TEMPLATE_EMAIL_VERIFICATION",    // Explicit mailbox verification
    FORGOT_PASSWORD: "TEMPLATE_RECOVERY_OTP",       // Security reset credentials path
    PASSWORD_CHANGED: "TEMPLATE_REVISED_SECURITY",  // Pass change notification audit
    CUSTOMER_ORDER: "TEMPLATE_ORDER_CONFIRM",       // Quiet luxury client receipt details
    ADMIN_ORDER: "TEMPLATE_ADMIN_NOTIFICATION",     // Operational dispatch notification
    PROCESSING: "TEMPLATE_ORDER_PROCESSING",        // Order manufacturing initiated
    PACKED: "TEMPLATE_ORDER_PACKED",                // Quality checking and parcel ready
    SHIPPED: "TEMPLATE_ORDER_SHIPPED",              // Dispatched into transit pipeline
    DELIVERED: "TEMPLATE_ORDER_DELIVERED",          // Delivered successfully concierge notification
    CANCELLED: "TEMPLATE_ORDER_CANCELLED",          // Transaction cancelled notification
    TRACKING_UPDATED: "TEMPLATE_TRACKING_UPDATED"   // Courier routing codes revision
  },

  // ============================================================================
  // 15. STRICT ENTERPRISE VALIDATION REGEX RULES
  // ============================================================================
  VALIDATION: {
    PHONE_REGEXP: "^(\\+?88)?01[3-9]\\d{8}$",        // Rigorous BD mobile regex match validator
    EMAIL_REGEXP: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", // Standard RFC email parser
    POSTAL_CODE_REGEXP: "^\\d{4,5}$",               // Matches standard regional sub-postcodes (BD/Global context)
    TRACKING_NUMBER_REGEXP: "^[a-zA-Z0-9\\-_]{5,30}$" // Secure routing sequence tracking match
  },

  // ============================================================================
  // 16. SECURITY CONTROLS CONFIGURATION
  // ============================================================================
  SECURITY: {
    ALLOWED_ORIGINS: [
      "https://roymen.com",                         // Corporate domain
      "https://www.roymen.com",                     // Corporate www
      "https://roymen-shop.vercel.app"              // Active secure Vercel client deployment
    ],
    RATE_LIMIT_PER_MINUTE: 120,                     // Inbound request limits for API
    MAX_PAYLOAD_SIZE_BYTES: 1048576,                // 1MB request volume protection
    ALLOWED_METHODS: ["GET", "POST", "PUT", "OPTIONS"] // Strict routing restrictions
  },

  // ============================================================================
  // 17. SYSTEM LOGGING METRICS & CONTROLS
  // ============================================================================
  LOGGING: {
    LEVELS: {
      DEBUG: "DEBUG",
      INFO: "INFO",
      WARNING: "WARNING",
      ERROR: "ERROR",
      SECURITY: "SECURITY"
    },
    MAX_LOG_ROWS: 5000,                             // Self-cleaning limit of logging rows
    AUDIT_RETENTION_DAYS: 90                       // Regulatory audit trail lifespan
  },

  // ============================================================================
  // 18. PERFORMANCE OPTIMIZATION CONTROLS (BATCH SIZE METRICS)
  // ============================================================================
  PERFORMANCE: {
    BATCH_SIZE: 100,                                // Optimal database operations chunk size
    READ_BATCH_SIZE: 500,                           // Google Sheet rows buffer bulk retrieval
    WRITE_BATCH_SIZE: 100,                          // Direct transactional append chunk size
    MAX_EXECUTION_TIME_SECONDS: 300                 // Target termination threshold to evade Google timeouts (5 mins limit)
  },

  // ============================================================================
  // 19. BACKUP CONFIGURATION (AUTOMATED ARCHIVES)
  // ============================================================================
  BACKUP: {
    FOLDER_NAME: "ROY_MEN_SYSTEM_BACKUPS",          // Destination directory in target Drive
    INTERVAL_HOURS: 24,                             // Cold storage dispatch frequency
    MAX_FILES: 30                                   // Keeps historical retention for a full month
  },

  // ============================================================================
  // 20. DASHBOARD CONFIGURATION (REFRESH INTERVALS)
  // ============================================================================
  DASHBOARD_CONFIG: {
    REFRESH_INTERVAL_MIN: 15,                       // Re-draw grid formatting interval
    KPI_UPDATE_INTERVAL_MIN: 5,                     // Re-calculate sum formulas cache
    CHART_REFRESH_INTERVAL_MIN: 30                  // Regenerate static visual components
  }
};
