export class AppError extends Error {
  public readonly statusCode: number;
  public readonly data?: Record<string, any>;

  constructor(message: string, statusCode = 400, data?: Record<string,any>) {
    super(message);
    this.statusCode = statusCode;
    this.data=data;
  }
}
