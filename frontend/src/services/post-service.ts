import api from "@/lib/axiosConfig";
import { Page } from "@/types/common/page";
import { PagedData } from "@/types/common/paged-data";
import { ReturnResult } from "@/types/common/return-result";
import { CreatePostDTO } from "@/types/post/create-post-dto";
import { SelectPostDTO } from "@/types/post/select-post-dto";
import { UpdatePostDTO } from "@/types/post/update-post-dto";

export const postService = {
    createPost: async (createPostDTO: CreatePostDTO): Promise<SelectPostDTO> => {
        const { data } = await api.post<ReturnResult<SelectPostDTO>>('/Posts', createPostDTO);
        return data.result;
    },

    getPostById: async (postId: string): Promise<SelectPostDTO> => {
        const { data } = await api.get<ReturnResult<SelectPostDTO>>(`/Posts/${postId}`);
        return data.result;
    },

    getPostsWithPagination: async (payload: Page<string>): Promise<PagedData<SelectPostDTO, string>> => {
        // Sử dụng POST cho paging vì payload (Page) có cấu trúc phức tạp (filter, sort)
        const { data } = await api.post<ReturnResult<PagedData<SelectPostDTO, string>>>('/Posts/paging', payload);
        return data.result ?? { data: [], page: payload };
    },

    getPostsByProfileId: async (profileId: string, payload: Page<string>): Promise<PagedData<SelectPostDTO, string>> => {
        const { data } = await api.post<ReturnResult<PagedData<SelectPostDTO, string>>>(`/Posts/profile/${profileId}/paging`, payload);
        return data.result ?? { data: [], page: payload };
    },

    getOverviewByProfileId: async (profileId: string, payload: Page<string>): Promise<PagedData<SelectPostDTO, string>> => {
        const { data } = await api.post<ReturnResult<PagedData<SelectPostDTO, string>>>(`/Posts/profile/${profileId}/overview/paging`, payload);
        return data.result ?? { data: [], page: payload };
    },

    updatePost: async (updatePostDTO: UpdatePostDTO): Promise<SelectPostDTO> => {
        const { data } = await api.put<ReturnResult<SelectPostDTO>>('/Posts', updatePostDTO);
        return data.result;
    },

    deletePostById: async (postId: string): Promise<boolean> => {
        const { data } = await api.delete<ReturnResult<boolean>>(`/Posts/${postId}`);
        return data.result;
    },

    /**
     * CHÚ Ý: Xóa nhiều Post dựa trên điều kiện lọc (Page payload)
     * * LỖI THƯỜNG GẶP: Axios định nghĩa api.delete(url, config). 
     * Khác với api.post(url, data), tham số thứ 2 của delete KHÔNG PHẢI là data.
     * * CÁCH FIX: Để gửi body trong request DELETE, phải bọc dữ liệu vào object config 
     * thông qua key 'data'. Nếu truyền trực tiếp payload, TS sẽ báo lỗi 
     * "Type has no properties in common with type 'AxiosRequestConfig'".
     */
    deletePosts: async (payload: Page<string>): Promise<number> => {
        const { data } = await api.delete<ReturnResult<number>>('/Posts', {
            data: payload // Bọc payload vào trong property 'data' của AxiosRequestConfig
        });
        return data.result;
    }
}