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
}

export enum ChatIntent {
    FINANCIAL_ADVICE = 'financial_advice',
    LOAN_SEARCH = 'loan_search',
    DEBIT_CARD_SEARCH = 'debit_card_search',
    CREDIT_CARD_SEARCH = 'credit_card_search',
    URGENT_LOAN_SEARCH = 'urgent_loan_search',
    BANK_CARD_OR_LOAN_SEARCH = 'bank_card_or_loan_search',
    OTHER = 'intent_other',
    UNKNOWN = 'intent_unknown',
}

export enum PbCollections {
    CHATS = 'chats'
}

export enum LLMProvider {
    DEEPSEEK = 'deepseek',
    DEEPINFRA = 'deepinfra',
}

export enum DeepInfraModels {
    LLAMA4_SCOUT_17B = 'meta-llama/Llama-4-Scout-17B-16E-Instruct',
    LLAMA4_MAVERICK_17B = 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8',
}

export enum DeepSeekModels {
    CHAT = 'deepseek-chat',
    REASONER = 'deepseek-reasoner',
}