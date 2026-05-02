import { ChatRole } from 'src/generated/prisma/client';

export interface UpdateRoleDto {
  Role: ChatRole;
}
