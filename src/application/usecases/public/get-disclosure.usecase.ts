import { DisclosureRepository } from "../../../domain/repositories/disclosure.repository";

export class GetDisclosureUseCase {
  constructor(private disclosureRepo: DisclosureRepository) {}

  async execute(slug: string): Promise<any | null> {
    return this.disclosureRepo.getBySlug(slug);
  }
}
