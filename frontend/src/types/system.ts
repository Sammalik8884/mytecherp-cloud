export interface ChecklistQuestionRequestDto {
    categoryId: number;
    prompt: string;
    description: string;
    inputType: string; // 'text', 'boolean', 'dropdown', 'photo'
    isRequired: boolean;
    options: string[]; // Options if dropdown
}

export interface ChecklistTemplateDto {
    id: number;
    assetCategoryId: number;
    questions: ChecklistQuestionDto[];
}

export interface ChecklistQuestionDto {
    id: number;
    prompt: string;
    inputType: string;
    isRequired: boolean;
    options?: string; // JSON string from DB
}

export interface AuditLogDto {
    id: number;
    entityName?: string;
    entityId?: number;
    action: string;
    details: string;
    oldValue: string;
    newValue: string;
    changedBy: string;
    changedByName?: string;
    date: string;
}
