import { apiClient } from "./apiClient";
import { ChecklistQuestionRequestDto, ChecklistTemplateDto } from "../types/system";

export const checklistService = {
    createQuestion: async (data: ChecklistQuestionRequestDto): Promise<{ message: string }> => {
        const payload = {
            Text: data.prompt,
            CategoryId: data.categoryId,
            Type: data.inputType,
            StandardRef: data.description || "",
            Options: data.options || []
        };
        const response = await apiClient.post<{ message: string }>("/Checklists", payload);
        return response.data;
    },

    getByCategory: async (categoryId: number): Promise<ChecklistTemplateDto> => {
        const response = await apiClient.get<any[]>(`/Checklists/category/${categoryId}`);

        const questions = response.data.map((q: any) => {
            let inputType = "boolean";
            let options = undefined;
            let isRequired = true;
            try {
                if (q.configJson) {
                    const conf = JSON.parse(q.configJson);
                    inputType = conf.type || q.type || "boolean";
                    options = conf.options && conf.options.length > 0 ? JSON.stringify(conf.options) : undefined;
                    if (conf.isRequired !== undefined) isRequired = conf.isRequired;
                } else if (q.type) {
                    inputType = q.type.toLowerCase();
                }
            } catch (e) { }

            return {
                id: q.id,
                prompt: q.text || "Untitled Question",
                inputType: inputType || "boolean",
                isRequired: isRequired,
                options: options
            };
        });

        return {
            id: categoryId,
            assetCategoryId: categoryId,
            questions: questions
        };
    }
};
