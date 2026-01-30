export interface OfferMeta {
    [key: string]: string;
}

export interface OfferType {
    id: number;
    name: string;
    type: string;
}

export interface ReviewsCounters {
    [key: string]: number;
}

export interface OfferParameter {
    name: string;
    type: string;
    value: string;
    verbose_value: string;
    additional_term: string;
    position: number;
    tech_id: string;
}

export interface OfferParameterCategory {
    name: string;
    offer_parameters: OfferParameter[];
    is_presented: boolean;
    position: number;
    tech_id: string;
}

export interface OfferHeader {
    title: string;
    value: string;
    additional_term: string;
    is_preview: boolean;
    options: Record<string, unknown>;
    position: number;
}

export interface OfferCountry {
    id: number;
    name: string;
    country_code: string;
}

export interface BankCategory {
    id: number;
    name: string;
    url_name: string;
}

export interface OfferBank {
    id: number;
    name: string;
    url_name: string;
    is_link_active: boolean;
    meta: OfferMeta;
    bank_category: BankCategory;
    head_office: string;
    phone: string;
    shareholders: string;
    website: string;
}

export interface OfferPicture {
    position: number;
    url: string;
    alt: string;
    type: string;
}

export interface ExpertReviewField {
    name: string;
    value: string;
}

export interface OfferItem {
    id: number;
    name: string;
    url_name: string;
    meta: OfferMeta;
    offer_type: OfferType;
    rating: string;
    reviews_count: number;
    reviews_counters: ReviewsCounters;
    offer_parameter_categories: OfferParameterCategory[];
    headers: OfferHeader[];
    country: OfferCountry;
    url: string;
    bank: OfferBank;
    avatar: string;
    is_partner: boolean;
    with_page: boolean;
    offer_pictures: OfferPicture[];
    tags: unknown[];
    rpc: number;
    expert_average: number;
    expert_review_fields: ExpertReviewField[];
    is_custom_url: boolean;
}

export interface OffersResponse {
    total: number;
    items: OfferItem[];
    page: number;
    size: number;
}