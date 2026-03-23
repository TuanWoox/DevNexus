import { CreateProfileDTO } from "../profile/create-profile-dto";

export interface RegisterAccountDTO {
    userName: string;
    password: string;
    email: string;
    onBoardInformation: CreateProfileDTO;
}