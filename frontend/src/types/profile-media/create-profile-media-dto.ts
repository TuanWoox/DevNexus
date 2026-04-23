import { ProfileMediaType } from "./profile-media-type";

export interface CreateProfileMediaDTO {
    file: File;
    profileMediaType: ProfileMediaType;
}
