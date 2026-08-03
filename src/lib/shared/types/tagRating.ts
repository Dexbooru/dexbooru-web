export type TagRatingPredictionRequest = {
	tag_string: string;
};

export type TagRatingPredictionResponse = {
	transformed_input: string;
	predicted_class: string;
	class_probabilities_percent: Record<string, number>;
};

export type TagRatingClassId = 's' | 'q' | 'e';
