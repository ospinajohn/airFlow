import { IsBoolean, IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class UpdateSettingsDto {
  @IsOptional()
  @IsBoolean({ message: 'autoStartPomodoro debe ser booleano' })
  autoStartPomodoro?: boolean;

  @IsOptional()
  @IsInt({ message: 'pomodoroWorkDuration debe ser un número entero' })
  @Min(1, { message: 'pomodoroWorkDuration debe ser al menos 1' })
  @Max(120, { message: 'pomodoroWorkDuration no puede superar 120' })
  pomodoroWorkDuration?: number;

  @IsOptional()
  @IsInt({ message: 'pomodoroShortBreakDuration debe ser un número entero' })
  @Min(1, { message: 'pomodoroShortBreakDuration debe ser al menos 1' })
  @Max(60, { message: 'pomodoroShortBreakDuration no puede superar 60' })
  pomodoroShortBreakDuration?: number;

  @IsOptional()
  @IsInt({ message: 'pomodoroLongBreakDuration debe ser un número entero' })
  @Min(1, { message: 'pomodoroLongBreakDuration debe ser al menos 1' })
  @Max(90, { message: 'pomodoroLongBreakDuration no puede superar 90' })
  pomodoroLongBreakDuration?: number;

  @IsOptional()
  @IsInt({ message: 'pomodoroCyclesUntilLongBreak debe ser un número entero' })
  @Min(1, { message: 'pomodoroCyclesUntilLongBreak debe ser al menos 1' })
  @Max(12, { message: 'pomodoroCyclesUntilLongBreak no puede superar 12' })
  pomodoroCyclesUntilLongBreak?: number;

  @IsOptional()
  @IsBoolean({ message: 'pomodoroAutoStartBreaks debe ser booleano' })
  pomodoroAutoStartBreaks?: boolean;

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
