import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../user.entity';

export class UpdateRoleDto {
  @ApiProperty({ enum: UserRole, example: 'Instructor' })
  @IsEnum(UserRole)
  role!: UserRole;
}
