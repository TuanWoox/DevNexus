export interface SelectTagDTO {
  id: string;
  name: string;
  postCount: number;
}

export interface CreateTagDTO {
  name: string;
}

export interface UpdateTagDTO {
  id: string;
  name: string;
}

export interface MergeTagsDTO {
  sourceTagId: string;
  targetTagId: string;
}
