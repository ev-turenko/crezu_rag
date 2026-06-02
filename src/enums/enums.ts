export enum ContentDataType {
    Markdown = 'markdown',
    Offers = 'offers',
    Html = 'html',
    Notification = 'notification',
    AppOffers = 'app_offers',
}

export enum ChatRole {
    System = 'system',
    User = 'user',
    Assistant = 'assistant',
    Dev = 'developer',
    Tool = 'tool',
    Function = 'function',
}

export enum ChatIntent {
    FINANCIAL_ADVICE = 'financial_advice',
    LOAN_SEARCH = 'loan_search',
    PRODUCT_COMPARISON = 'product_comparison',
    DEBIT_CARD_SEARCH = 'debit_card_search',
    CREDIT_CARD_SEARCH = 'credit_card_search',
    URGENT_LOAN_SEARCH = 'urgent_loan_search',
    BANK_CARD_OR_LOAN_SEARCH = 'bank_card_or_loan_search',
    OTHER = 'intent_other',
    UNKNOWN = 'intent_unknown',
}

export enum PbCollections {
    CHATS = 'chats',
    CLIENTS = 'clients',
    DELETION_REQUESTS = 'deletion_requests',
    APP_AUTH_USERS = 'app_auth_users',
    RECOVERY_CODES = 'recovery_codes',
}

// Countries that use external auth (finmatcher.com / finmart.mx / finmatcher.se)
// All other countries use our own PocketBase-backed registration.
export const EXTERNAL_AUTH_COUNTRIES = new Set(['mx', 'es', 'pl', 'sv', 'se']);

// Canonical language for each country that uses our own auth
export const COUNTRY_LANG_MAP: Record<string, string> = {
    co: 'es', de: 'de', kz: 'ru', lk: 'en', my: 'ms',
    pe: 'es', ph: 'en', ro: 'ro', ua: 'uk', vn: 'vi', za: 'en',
};

export enum LLMProvider {
    DEEPSEEK = 'deepseek',
    DEEPINFRA = 'deepinfra',
}

export enum DeepInfraModels {
    LLAMA4_SCOUT_17B = 'meta-llama/Llama-4-Scout-17B-16E-Instruct',
    LLAMA4_MAVERICK_17B = 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8',
    GEMMA_4_31B_IT = 'gemma-4-31B-it',
}

export enum DeepSeekModels {
    CHAT = 'deepseek-chat',
    REASONER = 'deepseek-reasoner',
}