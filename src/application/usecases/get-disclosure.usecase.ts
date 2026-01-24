import { DisclosureRepository } from "../../domain/repositories/disclosure.repository";

export class GetDisclosureUseCase {
  constructor(private disclosureRepo: DisclosureRepository) {}

  async execute(slug: string): Promise<any | null> {
    // Return raw or DTO
    return this.disclosureRepo.getBySlug(slug);
  }
}
