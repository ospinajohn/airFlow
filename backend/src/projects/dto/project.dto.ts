import { IsString, IsOptional, IsHexColor } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsString()
  @IsHexColor()
  @IsOptional()
  color?: string;
}

export class UpdateProjectDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsHexColor()
  @IsOptional()
  color?: string;
}
