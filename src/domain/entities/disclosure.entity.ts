export class Disclosure {
  constructor(
    public readonly slug: string,
    public readonly productName: string,
    public readonly totalCo2Kg: number,
    public readonly transportCo2Kg: number,
    public readonly verifiedAt: string = new Date().toISOString(),
    public readonly origin: string, // Partner ID
  ) {}
}
