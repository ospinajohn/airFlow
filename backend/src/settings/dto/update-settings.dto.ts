import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsBoolean({ message: 'autoStartPomodoro debe ser booleano' })
  autoStartPomodoro?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'showKanbanHealthCheck debe ser booleano' })
  showKanbanHealthCheck?: boolean;

  @IsOptional()
  @IsInt({ message: 'weekStartsOn debe ser un número entero' })
  @Min(0, { message: 'weekStartsOn solo admite 0 (domingo) o 1 (lunes)' })
  @Max(1, { message: 'weekStartsOn solo admite 0 (domingo) o 1 (lunes)' })
  weekStartsOn?: number;

  @IsOptional()
  @IsBoolean({ message: 'vibrationEnabled debe ser booleano' })
  vibrationEnabled?: boolean;

  @IsOptional()
  @IsIn(['dark', 'light', 'system'], {
    message: 'theme debe ser dark, light o system',
  })
  theme?: string;
}
