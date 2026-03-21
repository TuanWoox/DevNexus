import { CreateProfileDTO } from "../profile/create-profile-dto";

export interface RegisterAccountDTO {
    username: string;
    password: string;
    email: string;
    onBoardInformation: CreateProfileDTO;
}