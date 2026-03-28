export type TSimilaritySearchMlRequest =
	| {
			kind: 'image_url';
			imageUrl: string;
			topClosestMatchCount?: number;
			description?: string | null;
	  }
	| {
			kind: 'image_file';
			imageBytes: Uint8Array;
			filename: string;
			contentType: string;
			topClosestMatchCount?: number;
			description?: string | null;
	  };
